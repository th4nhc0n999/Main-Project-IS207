<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRefundConsoleTest extends TestCase
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

    public function test_admin_can_view_and_decide_refund_request(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Refund Patient',
                'relationship' => 'self',
                'gender' => 'male',
                'dob' => '1990-01-01',
            ]
        );
        $slot = Slot::where('owner_type', 'doctor')->where('owner_id', $doctor->id)->first();

        $booking = Booking::create([
            'code' => 'BK-REFUND-001',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'patient_snapshot' => ['full_name' => 'Refund Patient'],
            'status' => 'cancelled',
        ]);

        $payment = Payment::create([
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

        // Yêu cầu hoàn tiền dòng 1: Bệnh nhân hủy >24h (hoàn 100% phí khám = 200k, 0 tiện ích)
        $refund = Refund::create([
            'payment_id' => $payment->id,
            'booking_id' => $booking->id,
            'amount' => 200000,
            'exam_fee_refunded' => 200000,
            'service_fee_refunded' => 0,
            'policy_case' => 'patient_early_cancel',
            'reason' => 'Bệnh nhân bận công tác hủy trước 24h',
            'status' => 'requested',
            'refund_ref' => 'REF-001',
            'requested_by' => $this->patient->id,
            'requested_at' => now(),
        ]);

        // 1. Danh sách hoàn tiền
        $resList = $this->getJson('/api/admin/refunds');
        $resList->assertStatus(200)->assertJsonStructure(['data']);

        // 2. Chi tiết hoàn tiền
        $resShow = $this->getJson("/api/admin/refunds/{$refund->id}");
        $resShow->assertStatus(200)->assertJsonPath('data.amount', '200000');

        // 3. Admin Duyệt hoàn tiền (approved)
        $resApprove = $this->postJson("/api/admin/refunds/{$refund->id}/decide", [
            'decision' => 'approve',
            'reason' => 'Đủ điều kiện hủy trước 24h theo chính sách dòng 1',
        ]);
        $resApprove->assertStatus(200)->assertJsonPath('data.status', 'approved');

        // Kiểm tra Audit Log AU-16
        $this->assertTrue(AuditLog::where('action', 'AU-16')->where('entity_id', $refund->id)->exists());

        // 4. Giải ngân mô phỏng (succeeded)
        $resProcess = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $resProcess->assertStatus(200)->assertJsonPath('data.status', 'succeeded');

        // Kiểm tra Payment đã cập nhật refunded_amount = 200000 và status vẫn là paid (hoàn 1 phần)
        $payment->refresh();
        $this->assertEquals(200000, (int) $payment->refunded_amount);
        $this->assertEquals('paid', $payment->status instanceof \App\Enums\PaymentStatus ? $payment->status->value : (string) $payment->status);
    }

    public function test_full_refund_updates_payment_status_to_refunded(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Refund Full Patient',
                'relationship' => 'self',
                'gender' => 'female',
                'dob' => '1993-03-03',
            ]
        );
        $slot = Slot::where('owner_type', 'doctor')->first();

        $booking = Booking::create([
            'code' => 'BK-REFUND-FULL',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'patient_snapshot' => ['full_name' => 'Refund Full'],
            'status' => 'rejected',
        ]);

        $payment = Payment::create([
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

        // Hoàn 100% cả 2 loại phí = 220k (bác sĩ từ chối theo E05)
        $refund = Refund::create([
            'payment_id' => $payment->id,
            'booking_id' => $booking->id,
            'amount' => 220000,
            'exam_fee_refunded' => 200000,
            'service_fee_refunded' => 20000,
            'policy_case' => 'doctor_rejected',
            'reason' => 'Bác sĩ từ chối',
            'status' => 'approved',
            'refund_ref' => 'REF-FULL',
            'requested_by' => null,
            'requested_at' => now(),
        ]);

        $resProcess = $this->postJson("/api/admin/refunds/{$refund->id}/process-simulation");
        $resProcess->assertStatus(200)->assertJsonPath('data.status', 'succeeded');

        $payment->refresh();
        $this->assertEquals(220000, (int) $payment->refunded_amount);
        $this->assertEquals('refunded', $payment->status instanceof \App\Enums\PaymentStatus ? $payment->status->value : (string) $payment->status);
    }
}
