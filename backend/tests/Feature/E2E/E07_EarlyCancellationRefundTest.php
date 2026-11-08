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

class E07_EarlyCancellationRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_e07_patient_cancels_more_than_24h_before_slot_refunds_exam_fee_only(): void
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

        // Slot khám bắt đầu sau 48 giờ (> 24 giờ so với hiện tại)
        $workDate = now()->addDays(2)->format('Y-m-d');
        $slot = Slot::factory()->create([
            'owner_type' => 'doctor',
            'owner_id' => $doctor->id,
            'specialty_id' => $specialty->id,
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
            'work_date' => $workDate,
            'start_time' => '14:00:00',
            'end_time' => '14:30:00',
        ]);

        $profile = PatientProfile::factory()->create(['user_id' => $patient->id]);

        // Booking đã confirmed và đã thanh toán (như sau E01/T05)
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
        // BƯỚC 1: Bệnh nhân tự hủy trực tuyến (> 24h trước giờ khám) (T10)
        // =========================================================
        Sanctum::actingAs($patient);

        $cancelRes = $this->postJson("/api/doctor-bookings/{$booking->id}/cancel", [
            'version' => 1,
            'reason' => 'Bận việc đột xuất cần hủy lịch khám',
        ]);
        $cancelRes->assertStatus(200);

        // Kiểm tra kết quả Bước 1:
        // 1. Booking và Ticket đều sang trạng thái cancelled
        $booking->refresh();
        $this->assertEquals(BookingStatus::CANCELLED, $booking->status);

        $ticket->refresh();
        $this->assertEquals(TicketStatus::CANCELLED, $ticket->status);

        // 2. Slot giảm booked_count đi 1 và trở lại available
        $slot->refresh();
        $this->assertEquals(0, $slot->booked_count);
        $this->assertEquals('available', $slot->status);

        // 3. Hệ thống tạo yêu cầu hoàn 200.000đ (100% phí khám) và 0đ phí tiện ích (policy: early_cancellation)
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund, 'Hệ thống phải tự động tạo yêu cầu hoàn tiền khi hủy sớm.');
        $this->assertEquals(200000, (int) $refund->amount);
        $this->assertEquals(200000, (int) $refund->exam_fee_refunded);
        $this->assertEquals(0, (int) $refund->service_fee_refunded);
        $this->assertEquals('early_cancellation', $refund->policy_case);
        $this->assertEquals(RefundStatus::REQUESTED, $refund->status);

        // =========================================================
        // BƯỚC 2: Admin duyệt hoàn và giải ngân thành công
        // =========================================================
        Sanctum::actingAs($admin);

        // Admin duyệt (approve)
        $approveRes = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Duyệt hoàn 100% phí khám do bệnh nhân hủy trước 24h (E07)',
        ]);
        $approveRes->assertStatus(200);
        $approveRes->assertJsonPath('data.status', 'approved');

        // Admin giải ngân mô phỏng
        $processRes = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $processRes->assertStatus(200);
        $processRes->assertJsonPath('data.status', 'succeeded');

        // Payment cập nhật refunded_amount = 200000 và status vẫn là PAID (hoàn 1 phần)
        $payment->refresh();
        $this->assertEquals(200000, (int) $payment->refunded_amount);
        $this->assertEquals(PaymentStatus::PAID, $payment->status, 'Payment vẫn là PAID vì chỉ hoàn 1 phần phí khám.');
    }
}
