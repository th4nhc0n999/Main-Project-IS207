<?php

namespace Tests\Feature\E2E;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E04_PaymentFailureAndRetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_e04_payment_failure_and_retry_within_hold(): void
    {
        // Setup: Khởi tạo tài khoản bệnh nhân, bác sĩ, chuyên khoa và slot
        $patient = User::factory()->create([
            'role' => 'patient',
            'status' => 'active',
        ]);
        Sanctum::actingAs($patient);

        $specialty = Specialty::factory()->create(['code' => 'CK03', 'name' => 'Tim mạch']);
        $doctor = Doctor::factory()->create([
            'specialty_id' => $specialty->id,
            'consultation_fee' => 200000,
        ]);
        $slot = Slot::factory()->create([
            'owner_type' => 'doctor',
            'owner_id' => $doctor->id,
            'specialty_id' => $specialty->id,
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
            'work_date' => now()->addDays(2)->format('Y-m-d'),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        $initialHoldExpiry = now()->addMinutes(15)->setMicro(0);

        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'patient_profile_id' => $profile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'hospital_id' => null,
            'slot_id' => $slot->id,
            'status' => BookingStatus::PENDING_PAYMENT,
            'hold_expires_at' => $initialHoldExpiry,
        ]);

        $payment = Payment::factory()->create([
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 0,
            'status' => PaymentStatus::PENDING,
        ]);

        // =========================================================
        // BƯỚC 1: Bệnh nhân bắt đầu thanh toán lần 1
        // =========================================================
        $startRes1 = $this->postJson('/api/payments/start', [
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
        ]);
        $startRes1->assertStatus(200);
        $txCode1 = $startRes1->json('data.transaction_code');
        $this->assertNotEmpty($txCode1);

        $this->assertDatabaseHas('payment_transactions', [
            'payment_id' => $payment->id,
            'transaction_code' => $txCode1,
            'status' => 'pending',
            'amount' => 220000,
        ]);

        // =========================================================
        // BƯỚC 2: Cổng báo lỗi thanh toán (T14)
        // =========================================================
        $failRes = $this->postJson('/api/payments/simulate', [
            'transaction_code' => $txCode1,
            'status' => 'failed',
        ]);
        $failRes->assertStatus(200);

        // Kiểm tra 2: Hạn giữ không gia hạn, giữ nguyên
        $booking->refresh();
        $this->assertEquals(BookingStatus::PENDING_PAYMENT, $booking->status);
        $this->assertEquals(
            $initialHoldExpiry->toIso8601String(),
            $booking->hold_expires_at->toIso8601String(),
            'Hạn giữ chỗ hold_expires_at không được thay đổi/gia hạn khi giao dịch thất bại.'
        );

        // Bản ghi payments status chuyển sang failed, received_amount vẫn là 0
        $payment->refresh();
        $this->assertEquals('failed', $payment->status->value);
        $this->assertEquals(0, (int) $payment->received_amount);

        // =========================================================
        // BƯỚC 3: Thử lại trong hạn giữ chỗ, thành công (T02)
        // =========================================================
        $startRes2 = $this->postJson('/api/payments/start', [
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
        ]);
        $startRes2->assertStatus(200);
        $txCode2 = $startRes2->json('data.transaction_code');
        $this->assertNotEmpty($txCode2);
        $this->assertNotEquals($txCode1, $txCode2, 'Giao dịch thử lại phải sinh mã giao dịch mới.');

        // Cổng báo thanh toán thành công (T02)
        $successRes = $this->postJson('/api/payments/simulate', [
            'transaction_code' => $txCode2,
            'status' => 'success',
        ]);
        $successRes->assertStatus(200);

        // =========================================================
        // KIỂM TRA NGHIỆM THU E04:
        // - Đúng 1 booking, đúng 1 record payments
        // - payment_transactions có 1 bản ghi failed và 1 bản ghi success
        // - Booking chuyển sang pending_approval (lịch bác sĩ)
        // =========================================================
        $this->assertEquals(1, Booking::where('id', $booking->id)->count());
        $this->assertEquals(1, Payment::where('booking_id', $booking->id)->count());

        $transactions = DB::table('payment_transactions')
            ->where('payment_id', $payment->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $transactions, 'payment_transactions phải có đúng 2 bản ghi.');
        $this->assertEquals('failed', $transactions[0]->status);
        $this->assertEquals($txCode1, $transactions[0]->transaction_code);
        $this->assertEquals('success', $transactions[1]->status);
        $this->assertEquals($txCode2, $transactions[1]->transaction_code);

        $booking->refresh();
        $this->assertEquals(
            BookingStatus::PENDING_APPROVAL,
            $booking->status,
            'Lịch bác sĩ sau khi thanh toán thành công phải chuyển sang pending_approval.'
        );

        $payment->refresh();
        $this->assertEquals('paid', $payment->status->value);
        $this->assertEquals(220000, (int) $payment->received_amount);

        // =========================================================
        // BƯỚC 4: Callback gửi lần hai không xử lý trùng (T15 - Idempotency)
        // =========================================================
        $dupRes = $this->postJson('/api/payments/simulate', [
            'transaction_code' => $txCode2,
            'status' => 'success',
        ]);
        $dupRes->assertStatus(200);

        // Xác nhận không bị nhân đôi số tiền hoặc tạo thêm giao dịch
        $this->assertEquals(2, DB::table('payment_transactions')->where('payment_id', $payment->id)->count());
        $payment->refresh();
        $this->assertEquals(220000, (int) $payment->received_amount);
        $booking->refresh();
        $this->assertEquals(BookingStatus::PENDING_APPROVAL, $booking->status);
    }
}
