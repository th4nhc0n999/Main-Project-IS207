<?php

namespace Tests\Feature\E2E;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Jobs\ProcessBookingExpiriesJob;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\BookingStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E06_ApprovalExpiryRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_e06_approval_expiry_beyond_30_minutes_triggers_full_refund(): void
    {
        // Setup: Khởi tạo tài khoản bệnh nhân, bác sĩ, Admin
        $patient = User::factory()->create([
            'role' => 'patient',
            'status' => 'active',
        ]);
        $doctorUser = User::factory()->create([
            'role' => 'doctor',
            'status' => 'active',
        ]);
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        $specialty = Specialty::factory()->create(['code' => 'CK03', 'name' => 'Tim mạch']);
        $doctor = Doctor::factory()->create([
            'user_id' => $doctorUser->id,
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
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        // Booking đang ở pending_approval nhưng đã quá 30 phút mà bác sĩ không phản hồi
        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'patient_profile_id' => $profile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => BookingStatus::PENDING_APPROVAL,
            'approval_expires_at' => now()->subMinutes(5), // Đã hết hạn duyệt
            'version' => 1,
        ]);

        $payment = Payment::factory()->create([
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 220000,
            'refunded_amount' => 0,
            'status' => PaymentStatus::PAID,
            'paid_at' => now()->subMinutes(35),
        ]);

        // =========================================================
        // BƯỚC 1: Chạy Job hết hạn duyệt 30 phút (T07)
        // =========================================================
        $job = new ProcessBookingExpiriesJob();
        $job->handle(app(BookingStateMachine::class), app(AuditLogger::class));

        // Kiểm tra kết quả Bước 1:
        // 1. Trạng thái booking chuyển sang expired
        $booking->refresh();
        $this->assertEquals(BookingStatus::EXPIRED, $booking->status);

        // 2. Slot giảm booked_count đi 1 và trở lại available
        $slot->refresh();
        $this->assertEquals(0, $slot->booked_count);
        $this->assertEquals('available', $slot->status);

        // 3. Hệ thống tự động tạo yêu cầu hoàn 100% (220.000đ) với policy_case: approval_expired
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động tạo yêu cầu hoàn tiền khi hết hạn duyệt.');
        $this->assertEquals(220000, (int) $refund->amount);
        $this->assertEquals(200000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(20000, (int) $refund->service_fee_refunded);
        $this->assertEquals('approval_expired', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // =========================================================
        // BƯỚC 2: Admin duyệt hoàn và giải ngân thành công
        // =========================================================
        Sanctum::actingAs($admin);

        // Admin duyệt (approve)
        $approveRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Duyệt hoàn tiền 100% do bác sĩ không phản hồi trong 30 phút (E06)',
        ]);
        $approveRes->assertStatus(200);
        $approveRes->assertJsonPath('data.status', 'approved');

        // Admin giải ngân mô phỏng
        $processRes = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $processRes->assertStatus(200);
        $processRes->assertJsonPath('data.status', 'succeeded');

        $payment->refresh();
        $this->assertEquals(220000, (int) $payment->refunded_amount);
        $this->assertEquals(PaymentStatus::REFUNDED, $payment->status);
    }
}

