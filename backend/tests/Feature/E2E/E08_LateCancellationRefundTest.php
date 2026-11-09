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

class E08_LateCancellationRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_e08_late_cancellation_under_24h_requires_admin_and_refunds_50_percent_exam_fee(): void
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

        // Slot khám bắt đầu sau 12 giờ (< 24 giờ so với hiện tại)
        $slotTime = now()->addHours(12);
        $slot = Slot::factory()->create([
            'owner_type' => 'doctor',
            'owner_id' => $doctor->id,
            'specialty_id' => $specialty->id,
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
            'work_date' => $slotTime->format('Y-m-d'),
            'start_time' => $slotTime->format('H:i:s'),
            'end_time' => $slotTime->addMinutes(30)->format('H:i:s'),
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
        // BƯỚC 1: Bệnh nhân cố gắng tự hủy (< 24h) -> Bị từ chối (422)
        // =========================================================
        Sanctum::actingAs($patient);

        $patientCancelRes = $this->postJson("/api/doctor-bookings/{$booking->id}/cancel", [
            'version' => 1,
            'reason' => 'Bận đột xuất muốn hủy lịch sát giờ',
        ]);
        $patientCancelRes->assertStatus(422);

        // Booking vẫn là confirmed, chưa bị hủy
        $booking->refresh();
        $this->assertEquals(BookingStatus::CONFIRMED, $booking->status);

        // =========================================================
        // BƯỚC 2: Admin can thiệp hủy hộ với lý do (T10)
        // =========================================================
        Sanctum::actingAs($admin);

        $adminCancelRes = $this->postJson("/api/admin/bookings/{$booking->id}/cancel", [
            'reason' => 'Admin hỗ trợ bệnh nhân hủy sát giờ theo yêu cầu tổng đài',
        ]);
        $adminCancelRes->assertStatus(200);

        // Booking và Ticket chuyển sang cancelled
        $booking->refresh();
        $this->assertEquals(BookingStatus::CANCELLED, $booking->status);

        $ticket->refresh();
        $this->assertEquals(TicketStatus::CANCELLED, $ticket->status);

        // =========================================================
        // BƯỚC 3: Kiểm tra yêu cầu hoàn tiền: 50% phí khám (100.000đ), 0đ tiện ích
        // =========================================================
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động tạo yêu cầu hoàn tiền khi Admin hủy dưới 24h.');
        $this->assertEquals(100000, (int) $refund->amount, 'Hủy dưới 24h chỉ hoàn 50% phí khám (100.000đ).');
        $this->assertEquals(100000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(0, (int) $refund->service_fee_refunded);
        $this->assertEquals('late_cancellation', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // Admin duyệt hoàn
        $approveRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Duyệt hoàn 50% phí khám theo chính sách hủy dưới 24h (E08)',
        ]);
        $approveRes->assertStatus(200);
        $approveRes->assertJsonPath('data.status', 'approved');

        // Admin giải ngân mô phỏng
        $processRes = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $processRes->assertStatus(200);
        $processRes->assertJsonPath('data.status', 'succeeded');

        $payment->refresh();
        $this->assertEquals(100000, (int) $payment->refunded_amount);
        $this->assertEquals(PaymentStatus::PAID, $payment->status, 'Payment vẫn là PAID vì chỉ hoàn 1 phần phí.');
    }
}
