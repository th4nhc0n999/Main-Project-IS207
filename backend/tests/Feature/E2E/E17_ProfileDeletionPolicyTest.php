<?php

namespace Tests\Feature\E2E;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientConsent;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E17_ProfileDeletionPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_e17_profile_deletion_policy_three_scenarios_and_restore(): void
    {
        // Setup: Patient account
        $user = User::factory()->create(['role' => 'patient']);
        Sanctum::actingAs($user);

        $specialty = Specialty::factory()->create();
        $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);
        $slot1 = Slot::factory()->create(['owner_id' => $doctor->id, 'specialty_id' => $specialty->id]);
        $slot2 = Slot::factory()->create(['owner_id' => $doctor->id, 'specialty_id' => $specialty->id]);

        // Hồ sơ 1: Có lịch khám đang chờ duyệt (pending_approval)
        $pendingProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $pendingProfile->id,
            'slot_id' => $slot1->id,
            'doctor_id' => $doctor->id,
            'status' => BookingStatus::PendingApproval,
        ]);

        // Hồ sơ 2: Có lịch sử khám cũ đã hoàn tất (completed)
        $historyProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $historyProfile->id,
            'slot_id' => $slot2->id,
            'doctor_id' => $doctor->id,
            'status' => BookingStatus::Completed,
        ]);

        // Hồ sơ 3: Chưa từng đặt lịch nào + có bản ghi consent
        $neverBookedProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        $consent = PatientConsent::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $neverBookedProfile->id,
            'is_agreed' => true,
        ]);

        // =========================================================
        // 1. Hồ sơ có lịch chờ -> Chặn xóa với mã lỗi EX-PRF-06
        // =========================================================
        $response1 = $this->deleteJson("/api/patient-profiles/{$pendingProfile->id}");

        $response1->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error_code' => 'EX-PRF-06',
            ]);

        $this->assertDatabaseHas('patient_profiles', [
            'id' => $pendingProfile->id,
            'deleted_at' => null,
        ]);

        // =========================================================
        // 2. Hồ sơ có lịch sử cũ -> Xóa mềm (Soft Delete)
        // =========================================================
        $response2 = $this->deleteJson("/api/patient-profiles/{$historyProfile->id}");

        $response2->assertStatus(200);

        $this->assertSoftDeleted('patient_profiles', [
            'id' => $historyProfile->id,
        ]);

        // Kiểm tra khôi phục hồ sơ đã xóa mềm (restore)
        $restoreResp = $this->postJson("/api/patient-profiles/{$historyProfile->id}/restore");
        $restoreResp->assertStatus(200);

        $this->assertDatabaseHas('patient_profiles', [
            'id' => $historyProfile->id,
            'deleted_at' => null,
        ]);

        // =========================================================
        // 3. Hồ sơ chưa từng đặt lịch -> Xóa cứng (Hard Delete), giữ nguyên consent
        // =========================================================
        $response3 = $this->deleteJson("/api/patient-profiles/{$neverBookedProfile->id}");

        $response3->assertStatus(200);

        // Bản ghi bị xóa khỏi bảng patient_profiles
        $this->assertDatabaseMissing('patient_profiles', [
            'id' => $neverBookedProfile->id,
        ]);

        // Bằng chứng consent vẫn được bảo lưu đối soát
        $this->assertDatabaseHas('patient_consents', [
            'id' => $consent->id,
            'patient_profile_id' => $neverBookedProfile->id,
            'is_agreed' => true,
        ]);
    }
}
