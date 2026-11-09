<?php

namespace Tests\Feature\E2E;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E10_LatePaymentAfterExpiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_e10_late_payment_after_expiry_triggers_refund_and_admin_approval(): void
    {
        // Setup: Khởi tạo tài khoản bệnh nhân, Admin, bác sĩ, chuyên khoa và slot
        $patient = User::factory()->create([
            'role' => 'patient',
            'status' => 'active',
        ]);
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

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
            'booked_count' => 0, // Đã nhả slot do hết hạn ở E03
            'status' => 'available',
            'work_date' => now()->addDays(2)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        // Trạng thái ban đầu: Lịch đã expired (như sau E03)
        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'patient_profile_id' => $profile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => BookingStatus::EXPIRED,
            'hold_expires_at' => now()->subMinutes(20), // Hết hạn từ trước
        ]);

        $payment = Payment::factory()->create([
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 0,
            'status' => PaymentStatus::EXPIRED,
        ]);

        // Cấu hình secret cho gateway callback
        config(['services.medsi_gateway.secret' => 'medsi_secret_key_e10']);

        // =========================================================
        // BƯỚC 1: Cổng báo thu thành công 220.000đ sau khi lịch hết hạn (T16)
        // =========================================================
        $lateTxCode = 'SIM-LATE-'.uniqid();
        $payload = [
            'booking_id' => $booking->id,
            'transaction_code' => $lateTxCode,
            'amount' => 220000,
            'status' => 'success',
        ];
        $signature = hash_hmac('sha256', json_encode($payload), 'medsi_secret_key_e10');

        $response = $this->postJson('/api/payments/gateway/callback', $payload, [
            'X-MedSi-Signature' => $signature,
        ]);
        $response->assertStatus(200);

        // Kiểm tra kịch bản E10 sau T16:
        // 1. Lịch VẪN ở trạng thái expired
        $booking->refresh();
        $this->assertEquals(
            BookingStatus::EXPIRED,
            $booking->status,
            'Lịch đã expired nhận thanh toán muộn vẫn phải giữ nguyên trạng thái expired.'
        );

        // 2. payment_transactions thêm 1 bản ghi success
        $this->assertDatabaseHas('payment_transactions', [
            'payment_id' => $payment->id,
            'transaction_code' => $lateTxCode,
            'amount' => 220000,
            'status' => 'success',
            'source' => 'gateway',
        ]);

        // 3. payments.received_amount = 220.000đ
        $payment->refresh();
        $this->assertEquals(220000, (int) $payment->received_amount);
        $this->assertEquals('paid', $payment->status->value);

        // 4. Hệ thống tự động tạo yêu cầu hoàn 220.000đ với policy_case: late_payment
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động sinh bản ghi refund cho tiền đến muộn.');
        $this->assertEquals(220000, (int) $refund->amount);
        $this->assertEquals(200000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(20000, (int) $refund->service_fee_refunded);
        $this->assertEquals('late_payment', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // =========================================================
        // BƯỚC 2: Admin duyệt hoàn
        // =========================================================
        Sanctum::actingAs($admin);

        // Admin duyệt yêu cầu hoàn tiền
        $decideRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Duyệt hoàn tiền cho giao dịch thanh toán đến muộn sau khi lịch đã hết hạn',
        ]);
        $decideRes->assertStatus(200);
        $decideRes->assertJsonPath('data.status', 'approved');

        $refund->refresh();
        $this->assertEquals(RefundStatus::APPROVED, $refund->status);

        // Admin tiến hành giải ngân mô phỏng (succeeded)
        $processRes = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $processRes->assertStatus(200);
        $processRes->assertJsonPath('data.status', 'succeeded');

        $refund->refresh();
        $this->assertEquals(RefundStatus::SUCCEEDED, $refund->status);

        $payment->refresh();
        $this->assertEquals(220000, (int) $payment->refunded_amount);
        $this->assertEquals('refunded', $payment->status->value);
    }
}
