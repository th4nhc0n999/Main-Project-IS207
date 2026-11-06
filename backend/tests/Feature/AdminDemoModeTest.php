<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Slot;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDemoModeTest extends TestCase
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

    public function test_admin_can_simulate_payment_success_with_demo_source_and_au17(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Demo Patient',
                'relationship' => 'self',
                'gender' => 'male',
                'dob' => '1992-05-10',
            ]
        );
        $slot = Slot::where('owner_type', 'doctor')->where('owner_id', $doctor->id)->where('status', 'available')->first();

        // Tạo 1 booking trạng thái pending_payment
        $booking = Booking::create([
            'code' => 'BK-DEMO-PAY',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'patient_snapshot' => ['full_name' => 'Demo Patient'],
            'status' => 'pending_payment',
        ]);

        $response = $this->postJson("/api/admin/demo/bookings/{$booking->id}/simulate-payment", [
            'notes' => 'Testing simulator',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'pending_approval');

        // Kiểm tra PaymentTransaction có source = demo_admin
        $transaction = PaymentTransaction::where('source', 'demo_admin')->first();
        $this->assertNotNull($transaction);
        $this->assertEquals(220000, (int) $transaction->amount);
        $this->assertEquals('success', $transaction->status);

        // Kiểm tra Payment status = paid
        $payment = Payment::where('booking_id', $booking->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals('paid', $payment->status);

        // Kiểm tra Audit Log AU-17
        $auditLog = AuditLog::where('action', 'AU-17')
            ->where('entity_id', $booking->id)
            ->first();
        $this->assertNotNull($auditLog);
        $this->assertEquals($this->admin->id, $auditLog->actor_id);
        $this->assertEquals('demo_admin', $auditLog->changes['source']);
    }

    public function test_admin_can_override_doctor_approval_and_rejection(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Demo Patient 2',
                'relationship' => 'self',
                'gender' => 'female',
                'dob' => '1994-08-20',
            ]
        );
        $slots = Slot::where('owner_type', 'doctor')->where('owner_id', $doctor->id)->get();

        // 1. Test Duyệt thay bác sĩ (T05)
        $bookingApprove = Booking::create([
            'code' => 'BK-DEMO-APP',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slots[0]->id,
            'patient_snapshot' => ['full_name' => 'Demo Patient 2'],
            'status' => 'pending_approval',
        ]);

        $resApprove = $this->postJson("/api/admin/demo/bookings/{$bookingApprove->id}/override-decision", [
            'decision' => 'approve',
        ]);

        if ($resApprove->status() !== 200) {
            dump($resApprove->json());
        }
        $resApprove->assertStatus(200);
        $resApprove->assertJsonPath('data.status', 'confirmed');

        $logApprove = AuditLog::where('action', 'AU-17')
            ->where('entity_id', $bookingApprove->id)
            ->first();
        $this->assertNotNull($logApprove);
        $this->assertEquals('approve', $logApprove->changes['decision']);

        // 2. Test Từ chối thay bác sĩ (T06)
        $bookingReject = Booking::create([
            'code' => 'BK-DEMO-REJ',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slots[1]->id,
            'patient_snapshot' => ['full_name' => 'Demo Patient 2'],
            'status' => 'pending_approval',
        ]);

        $resReject = $this->postJson("/api/admin/demo/bookings/{$bookingReject->id}/override-decision", [
            'decision' => 'reject',
            'reason' => 'Bác sĩ bận hội chẩn đột xuất (demo)',
        ]);

        if ($resReject->status() !== 200) {
            dump($resReject->json());
        }
        $resReject->assertStatus(200);
        $resReject->assertJsonPath('data.status', 'rejected');

        $logReject = AuditLog::where('action', 'AU-17')
            ->where('entity_id', $bookingReject->id)
            ->first();
        $this->assertNotNull($logReject);
        $this->assertEquals('reject', $logReject->changes['decision']);
        $this->assertEquals('Bác sĩ bận hội chẩn đột xuất (demo)', $logReject->changes['reject_reason']);
    }
}
