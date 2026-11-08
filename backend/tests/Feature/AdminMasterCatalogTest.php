<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminMasterCatalogTest extends TestCase
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

    public function test_non_admin_cannot_access_catalog_apis(): void
    {
        Sanctum::actingAs($this->patient);

        $response = $this->getJson('/api/admin/specialties');
        $response->assertStatus(403);
    }

    public function test_admin_can_crud_specialty(): void
    {
        Sanctum::actingAs($this->admin);

        // List
        $resList = $this->getJson('/api/admin/specialties');
        $resList->assertStatus(200)->assertJsonStructure(['data']);

        // Create
        $resCreate = $this->postJson('/api/admin/specialties', [
            'code' => 'CK99',
            'name' => 'Chuyên Khoa Thử Nghiệm',
            'description' => 'Mô tả thử nghiệm',
        ]);
        $resCreate->assertStatus(201);
        $id = $resCreate->json('data.id');

        // Show
        $resShow = $this->getJson("/api/admin/specialties/{$id}");
        $resShow->assertStatus(200)->assertJsonPath('data.name', 'Chuyên Khoa Thử Nghiệm');

        // Update
        $resUpdate = $this->putJson("/api/admin/specialties/{$id}", [
            'code' => 'CK99',
            'name' => 'Chuyên Khoa Đã Đổi Tên',
        ]);
        $resUpdate->assertStatus(200)->assertJsonPath('data.name', 'Chuyên Khoa Đã Đổi Tên');

        // Delete thành công khi chưa có liên kết
        $resDelete = $this->deleteJson("/api/admin/specialties/{$id}");
        $resDelete->assertStatus(200);
        $this->assertNull(Specialty::find($id));
    }

    public function test_admin_cannot_delete_doctor_with_active_bookings(): void
    {
        Sanctum::actingAs($this->admin);

        $doctor = Doctor::find(1);
        $patientProfile = PatientProfile::firstOrCreate(
            ['user_id' => $this->patient->id],
            [
                'full_name' => 'Bệnh nhân thử nghiệm',
                'relationship' => 'self',
                'gender' => 'male',
                'dob' => '1995-01-01',
            ]
        );

        $slot = Slot::where('owner_type', 'doctor')->where('owner_id', $doctor->id)->first();

        // Tạo 1 booking trạng thái confirmed
        Booking::create([
            'code' => 'BK-TEST-001',
            'user_id' => $this->patient->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'patient_snapshot' => ['full_name' => 'Test'],
            'status' => 'confirmed',
        ]);

        // Cố tình xóa bác sĩ -> phải bị chặn (HTTP 422) theo BR-ADM-01
        $response = $this->deleteJson("/api/admin/doctors/{$doctor->id}");
        $response->assertStatus(422);
        $this->assertStringContainsString('chưa hoàn tất', $response->json('message'));

        // Bác sĩ vẫn còn trong DB
        $this->assertNotNull(Doctor::find($doctor->id));
    }

    public function test_admin_can_soft_delete_hospital_and_exam_type(): void
    {
        Sanctum::actingAs($this->admin);

        // Tạo bệnh viện mới không có lịch
        $hospital = Hospital::create([
            'name' => 'Bệnh Viện Test Soft Delete',
            'address' => 'Số 1 Đường Test',
            'city' => 'Hà Nội',
        ]);

        $resDeleteHosp = $this->deleteJson("/api/admin/hospitals/{$hospital->id}");
        $resDeleteHosp->assertStatus(200);

        // Kiểm tra soft delete
        $this->assertNull(Hospital::find($hospital->id));
        $this->assertNotNull(Hospital::withTrashed()->find($hospital->id));
        $this->assertNotNull(Hospital::withTrashed()->find($hospital->id)->deleted_at);
    }
}
