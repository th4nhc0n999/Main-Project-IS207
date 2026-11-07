<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\Ticket;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminNoShowConsoleTest extends TestCase
{
    protected User $admin;
    protected User $patient;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => database_path('database.sqlite')]);

        $this->artisan('migrate:fresh --database=sqlite --force');
        $this->seed(DatabaseSeeder::class);

        $this->admin = User::where('role', 'admin')->first();
        $this->patient = User::where('role', 'patient')->first();
    }

    public function test_e12_admin_confirms_no_show_and_expires_ticket_with_zero_refund(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'NoShow Patient',
                'relationship' => 'self',
                'gender' => 'male',
                'dob' => '1991-02-02',
            ]
        );

        // Lấy slot quá khứ id = 1 từ Seeder
        $pastSlot = Slot::find(1);

        // Tạo 1 booking confirmed cho slot này
        $booking = Booking::create([
            'code' => 'BK-NOSHOW-001',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $pastSlot->id,
            'patient_snapshot' => ['full_name' => 'NoShow Patient'],
            'status' => 'confirmed',
        ]);

        $ticket = Ticket::create([
            'booking_id' => $booking->id,
            'ticket_code' => 'TK-NOSHOW-001',
            'qr_token' => 'sample-qr-token',
            'queue_scope' => 'DOCTOR-1-PAST',
            'queue_seq' => 1,
            'queue_number' => 'A-01',
            'status' => 'issued',
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 220000,
            'refunded_amount' => 0,
            'status' => 'paid',
        ]);

        // 1. Kiểm tra danh sách eligible (Step 1)
        $resEligible = $this->getJson('/api/admin/no-shows/eligible');
        $resEligible->assertStatus(200);
        $bookingIds = collect($resEligible->json('data'))->pluck('id');
        $this->assertTrue($bookingIds->contains($booking->id));

        // 2. Admin xác nhận ghi vắng (Step 2 - T11)
        $resConfirm = $this->postJson("/api/admin/no-shows/bookings/{$booking->id}/confirm", [
            'reason' => 'Bệnh nhân không có mặt sau 15 phút',
        ]);
        $resConfirm->assertStatus(200);
        $resConfirm->assertJsonPath('data.status', 'no_show');

        // Kiểm tra ticket chuyển thành expired
        $ticket->refresh();
        $this->assertEquals('expired', $ticket->status instanceof \App\Enums\TicketStatus ? $ticket->status->value : (string) $ticket->status);

        // Kiểm tra không có refund tự động nào được tạo (hoàn 0đ theo dòng 12)
        $this->assertEquals(0, Refund::where('booking_id', $booking->id)->count());

        // Kiểm tra Audit Log ghi lại Admin xác nhận
        $log = AuditLog::where('action', 'T11')->where('entity_id', $booking->id)->first();
        $this->assertNotNull($log);
        $this->assertEquals($this->admin->id, $log->actor_id);

        // 3. Admin xử lý khiếu nại (Step 3) - Chấp thuận lý do chính đáng & hoàn tiền
        $resComplaint = $this->postJson("/api/admin/no-shows/bookings/{$booking->id}/complaint", [
            'resolution' => 'accept',
            'notes' => 'Bệnh nhân có giấy chứng nhận cấp cứu viện 115',
        ]);
        $resComplaint->assertStatus(200);
        $resComplaint->assertJsonPath('data.resolution', 'accept');

        // Kiểm tra đã tạo yêu cầu hoàn tiền đặc biệt
        $complaintRefund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($complaintRefund);
        $this->assertEquals('approved', $complaintRefund->status instanceof \App\Enums\RefundStatus ? $complaintRefund->status->value : (string) $complaintRefund->status);
        $this->assertEquals(200000, (int) $complaintRefund->amount);
    }
}
