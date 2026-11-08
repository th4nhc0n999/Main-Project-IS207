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

class E11_DuplicatePaymentCollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_e11_duplicate_payment_collection_retains_first_tx_and_triggers_refund(): void
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
            'booked_count' => 1,
            'status' => 'full',
            'work_date' => now()->addDays(2)->format('Y-m-d'),
            'start_time' => '14:00:00',
            'end_time' => '14:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        // Trạng thái ban đầu (như sau E01): Lịch đã thanh toán lần đầu (paid), đang chờ duyệt
        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'patient_profile_id' => $profile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => BookingStatus::PENDING_APPROVAL,
            'hold_expires_at' => now()->addMinutes(10),
            'approval_expires_at' => now()->addMinutes(30),
        ]);

        $payment = Payment::factory()->create([
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 220000, // Đã nhận khoản đầu 220k
            'refunded_amount' => 0,
            'status' => PaymentStatus::PAID,
            'paid_at' => now()->subMinutes(5),
        ]);

        $firstTxCode = 'TX-FIRST-'.uniqid();
        DB::table('payment_transactions')->insert([
            'payment_id' => $payment->id,
            'transaction_code' => $firstTxCode,
            'amount' => 220000,
            'status' => 'success',
            'source' => 'gateway',
            'received_at' => now()->subMinutes(5),
            'created_at' => now()->subMinutes(5),
            'updated_at' => now()->subMinutes(5),
        ]);

        // Cấu hình secret cho gateway callback
        config(['services.medsi_gateway.secret' => 'medsi_secret_key_e11']);

        // =========================================================
        // BƯỚC 1: Cổng báo thêm giao dịch có transaction_code khác, 220.000đ (T16)
        // =========================================================
        $dupTxCode = 'TX-DUP-'.uniqid();
        $payload = [
            'booking_id' => $booking->id,
            'transaction_code' => $dupTxCode,
            'amount' => 220000,
            'status' => 'success',
        ];
        $signature = hash_hmac('sha256', json_encode($payload), 'medsi_secret_key_e11');

        $response = $this->postJson('/api/payments/gateway/callback', $payload, [
            'X-MedSi-Signature' => $signature,
        ]);
        $response->assertStatus(200);

        // Kiểm tra kết quả Bước 1:
        // 1. Giao dịch đầu được giữ nguyên
        $this->assertDatabaseHas('payment_transactions', [
            'transaction_code' => $firstTxCode,
            'status' => 'success',
            'amount' => 220000,
        ]);

        // 2. Giao dịch thứ hai được ghi nhận
        $this->assertDatabaseHas('payment_transactions', [
            'transaction_code' => $dupTxCode,
            'status' => 'success',
            'amount' => 220000,
        ]);

        // 3. received_amount = 440.000đ
        $payment->refresh();
        $this->assertEquals(440000, (int) $payment->received_amount);

        // 4. Yêu cầu hoàn 220.000đ với policy_case: duplicate_payment
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động sinh bản ghi refund cho giao dịch thu lần hai.');
        $this->assertEquals(220000, (int) $refund->amount);
        $this->assertEquals(200000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(20000, (int) $refund->service_fee_refunded);
        $this->assertEquals('duplicate_payment', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // 5. Kiểm tra ràng buộc: refunded_amount không vượt received_amount
        $this->assertLessThanOrEqual((int) $payment->received_amount, (int) $payment->refunded_amount);

        // =========================================================
        // BƯỚC 2: Admin đối soát và duyệt hoàn
        // =========================================================
        Sanctum::actingAs($admin);

        // Admin duyệt hoàn
        $decideRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Admin đối soát xác nhận khoản thu trùng lặp và duyệt hoàn tiền 220.000đ',
        ]);
        $decideRes->assertStatus(200);
        $decideRes->assertJsonPath('data.status', 'approved');

        $refund->refresh();
        $this->assertEquals(RefundStatus::APPROVED, $refund->status);

        // Admin giải ngân mô phỏng
        $processRes = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $processRes->assertStatus(200);
        $processRes->assertJsonPath('data.status', 'succeeded');

        $refund->refresh();
        $this->assertEquals(RefundStatus::SUCCEEDED, $refund->status);

        $payment->refresh();
        // Sau khi hoàn khoản thu thứ hai (220.000đ), refunded_amount = 220.000đ <= received_amount (440.000đ)
        $this->assertEquals(220000, (int) $payment->refunded_amount);
        $this->assertLessThanOrEqual((int) $payment->received_amount, (int) $payment->refunded_amount);
        // Vì received_amount = 440.000 và refunded_amount = 220.000 (chưa hoàn hết), trạng thái thanh toán vẫn là paid
        $this->assertEquals(PaymentStatus::PAID, $payment->status);
    }
}

