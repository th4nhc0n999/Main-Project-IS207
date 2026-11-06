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

    public function test_e17_profile_deletion_policy_three_scenarios(): void
    {
        // Setup: Patient account
        $user = User::factory()->create(['role' => 'patient']);
        Sanctum::actingAs($user);

        $specialty = Specialty::factory()->create();
        $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);
        $slot1 = Slot::factory()->create(['owner_id' => $doctor->id, 'specialty_id' => $specialty->id]);
        $slot2 = Slot::factory()->create(['owner_id' => $doctor->id, 'specialty_id' => $specialty->id]);

        // Profile 1: One with a pending booking
        $pendingProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $pendingProfile->id,
            'slot_id' => $slot1->id,
            'doctor_id' => $doctor->id,
            'status' => BookingStatus::PendingApproval,
        ]);

        // Profile 2: One with past booking history (completed)
        $historyProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $historyProfile->id,
            'slot_id' => $slot2->id,
            'doctor_id' => $doctor->id,
            'status' => BookingStatus::Completed,
        ]);

        // Profile 3: Never booked, but has consent evidence
        $neverBookedProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        $consent = PatientConsent::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $neverBookedProfile->id,
            'is_agreed' => true,
        ]);

        // =========================================================
        // Action & Assertion 1: Pending booking blocks deletion with EX-PRF-06
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
        // Action & Assertion 2: Profile with history is soft-deleted
        // =========================================================
        $response2 = $this->deleteJson("/api/patient-profiles/{$historyProfile->id}");

        $response2->assertStatus(200);

        $this->assertSoftDeleted('patient_profiles', [
            'id' => $historyProfile->id,
        ]);

        // =========================================================
        // Action & Assertion 3: Never-booked profile is hard-deleted while consent remains
        // =========================================================
        $response3 = $this->deleteJson("/api/patient-profiles/{$neverBookedProfile->id}");

        $response3->assertStatus(200);

        // Record removed from patient_profiles
        $this->assertDatabaseMissing('patient_profiles', [
            'id' => $neverBookedProfile->id,
        ]);

        // Consent evidence remains intact
        $this->assertDatabaseHas('patient_consents', [
            'id' => $consent->id,
            'patient_profile_id' => $neverBookedProfile->id,
            'is_agreed' => true,
        ]);
    }
}
