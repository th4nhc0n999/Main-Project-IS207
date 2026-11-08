<?php

namespace Tests\Feature\E2E;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\TicketStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E09_DoctorEmergencyCancellationRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_e09_doctor_emergency_cancellation_blocks_slot_and_refunds_full_fees(): void
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
            'start_time' => '15:00:00',
            'end_time' => '15:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'patient_profile_id' => $profile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => BookingStatus::CONFIRMED,
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
            'paid_at' => now(),
        ]);

        $ticket = Ticket::factory()->create([
            'booking_id' => $booking->id,
            'status' => TicketStatus::ISSUED,
        ]);

        // =========================================================
        // BƯỚC 1: Bác sĩ nghỉ đột xuất hủy lịch (T10)
        // =========================================================
        Sanctum::actingAs($doctorUser);

        $doctorCancelRes = $this->postJson("/api/doctor-bookings/{$booking->id}/cancel", [
            'version' => 1,
            'reason' => 'Bác sĩ có lịch công tác khẩn cấp đột xuất',
        ]);
        $doctorCancelRes->assertStatus(200);

        // Kiểm tra kết quả Bước 1:
        // 1. Booking và Ticket đều chuyển sang cancelled
        $booking->refresh();
        $this->assertEquals(BookingStatus::CANCELLED, $booking->status);

        $ticket->refresh();
        $this->assertEquals(TicketStatus::CANCELLED, $ticket->status);

        // 2. Slot ca khám bị khóa (status = blocked) theo chính sách E09
        $slot->refresh();
        $this->assertEquals('blocked', $slot->status, 'Slot của bác sĩ nghỉ đột xuất phải bị chuyển sang blocked.');
        $this->assertEquals(0, $slot->booked_count);

        // 3. Hệ thống tạo yêu cầu hoàn 100% CẢ HAI LOẠI PHÍ (200.000đ khám + 20.000đ tiện ích = 220.000đ)
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động tạo yêu cầu hoàn tiền khi bác sĩ hủy.');
        $this->assertEquals(220000, (int) $refund->amount);
        $this->assertEquals(200000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(20000, (int) $refund->service_fee_refunded);
        $this->assertEquals('doctor_unavailable', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // =========================================================
        // BƯỚC 2: Admin duyệt hoàn và giải ngân thành công
        // =========================================================
        Sanctum::actingAs($admin);

        // Admin duyệt (approve)
        $approveRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Duyệt hoàn 100% cả 2 phí do bác sĩ nghỉ đột xuất (E09)',
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
