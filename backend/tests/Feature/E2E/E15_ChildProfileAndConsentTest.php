<?php

namespace Tests\Feature\E2E;

use App\Models\PatientConsent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E15_ChildProfileAndConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_e15_child_profile_requires_guardian_consent_and_returns_masked_data(): void
    {
        // Setup: New patient account
        $patientUser = User::factory()->create([
            'role' => 'patient',
        ]);
        Sanctum::actingAs($patientUser);

        $childDob = now()->subYears(8)->format('Y-m-d');

        // Step 1: Save child profile without guardian info -> Fails validation
        $responseNoGuardian = $this->postJson('/api/patient-profiles', [
            'full_name' => 'Nguyễn Văn Bé',
            'dob' => $childDob,
            'gender' => 'male',
            'relationship' => 'Con',
            'consent_agreed' => true,
        ]);

        $responseNoGuardian->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone', 'guardian_relationship']);

        // Step 2: Attempt save with guardian info but without consent -> Fails validation
        $responseNoConsent = $this->postJson('/api/patient-profiles', [
            'full_name' => 'Nguyễn Văn Bé',
            'dob' => $childDob,
            'gender' => 'male',
            'relationship' => 'Con',
            'guardian_name' => 'Nguyễn Văn Cha',
            'guardian_phone' => '0901234567',
            'guardian_relationship' => 'Bố',
            'consent_agreed' => false,
        ]);

        $responseNoConsent->assertStatus(422)
            ->assertJsonValidationErrors(['consent_agreed']);

        // Step 3: Record consent and save with guardian info -> Succeeds (HTTP 201)
        $validPayload = [
            'full_name' => 'Nguyễn Văn Bé',
            'dob' => $childDob,
            'gender' => 'male',
            'relationship' => 'Con',
            'identity_card_number' => '001099123456',
            'phone' => '0912345678',
            'guardian_name' => 'Nguyễn Văn Cha',
            'guardian_phone' => '0901234567',
            'guardian_relationship' => 'Bố',
            'consent_agreed' => true,
        ];

        $responseSuccess = $this->postJson('/api/patient-profiles', $validPayload);

        $responseSuccess->assertStatus(201);
        $createdId = $responseSuccess->json('data.id');

        // Assert: Exactly one consent record exists in database
        $this->assertEquals(
            1,
            PatientConsent::where('patient_profile_id', $createdId)->count(),
            'Expected exactly one consent record for the created profile.'
        );

        $this->assertDatabaseHas('patient_consents', [
            'user_id' => $patientUser->id,
            'patient_profile_id' => $createdId,
            'is_agreed' => true,
        ]);

        // Assert: ID number and phone are masked in responses
        $responseData = $responseSuccess->json('data');

        $this->assertNotEquals('001099123456', $responseData['identity_card_number']);
        $this->assertStringContainsString('****', $responseData['identity_card_number']);

        $this->assertNotEquals('0912345678', $responseData['phone']);
        $this->assertStringContainsString('*****', $responseData['phone']);

        $this->assertNotEquals('0901234567', $responseData['guardian_phone']);
        $this->assertStringContainsString('*****', $responseData['guardian_phone']);
    }
}
