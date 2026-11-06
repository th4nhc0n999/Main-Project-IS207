<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReportsTest extends TestCase
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

    public function test_admin_can_get_all_four_reports(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor1 = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Report Patient',
                'relationship' => 'self',
                'gender' => 'male',
                'dob' => '1990-01-01',
            ]
        );

        $slots = Slot::where('owner_type', 'doctor')->get();

        // 1. Tạo 1 booking completed có payment 220k
        $b1 = Booking::create([
            'code' => 'BK-RPT-01',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor1->id,
            'slot_id' => $slots[0]->id,
            'patient_snapshot' => ['full_name' => 'Report Patient'],
            'status' => 'completed',
        ]);
        Payment::create([
            'booking_id' => $b1->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 220000,
            'refunded_amount' => 0,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // 2. Tạo 1 booking cancelled có refund succeeded 200k
        $b2 = Booking::create([
            'code' => 'BK-RPT-02',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor1->id,
            'slot_id' => $slots[1]->id,
            'patient_snapshot' => ['full_name' => 'Report Patient'],
            'status' => 'cancelled',
            'cancel_reason_code' => 'patient_request',
        ]);
        $p2 = Payment::create([
            'booking_id' => $b2->id,
            'method' => 'qr_pay',
            'exam_fee' => 200000,
            'discount_amount' => 0,
            'service_fee' => 20000,
            'total_amount' => 220000,
            'received_amount' => 220000,
            'refunded_amount' => 200000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        Refund::create([
            'payment_id' => $p2->id,
            'booking_id' => $b2->id,
            'amount' => 200000,
            'exam_fee_refunded' => 200000,
            'service_fee_refunded' => 0,
            'policy_case' => 'patient_early_cancel',
            'reason' => 'Hủy trước 24h',
            'status' => 'succeeded',
            'refund_ref' => 'REF-RPT-01',
            'requested_by' => $this->patient->id,
            'requested_at' => now(),
            'processed_at' => now(),
        ]);

        // Test Báo cáo 1: 9 trạng thái lịch hẹn
        $resStatus = $this->getJson('/api/admin/reports/booking-status');
        $resStatus->assertStatus(200);
        $resStatus->assertJsonPath('data.total_bookings', 2);
        $this->assertCount(9, $resStatus->json('data.details'));

        // Test Báo cáo 2: Doanh thu ròng (220k + 220k thu = 440k gộp; hoàn 200k -> ròng = 240k)
        $resRev = $this->getJson('/api/admin/reports/net-revenue');
        $resRev->assertStatus(200);
        $resRev->assertJsonPath('data.gross_revenue', 440000);
        $resRev->assertJsonPath('data.total_refunded', 200000);
        $resRev->assertJsonPath('data.net_revenue', 240000);

        // Test Báo cáo 3: Tỷ lệ hủy theo nguyên nhân (1 hủy / 2 lịch = 50%)
        $resCancel = $this->getJson('/api/admin/reports/cancellation-rate');
        $resCancel->assertStatus(200);
        $resCancel->assertJsonPath('data.total_cancelled', 1);
        $resCancel->assertJsonPath('data.cancellation_rate', 50);

        // Test Báo cáo 4: Top Bác sĩ & Chuyên khoa
        $resTop = $this->getJson('/api/admin/reports/top-booked');
        $resTop->assertStatus(200);
        $this->assertNotEmpty($resTop->json('data.top_doctors'));
        $this->assertNotEmpty($resTop->json('data.top_specialties'));
    }
}

