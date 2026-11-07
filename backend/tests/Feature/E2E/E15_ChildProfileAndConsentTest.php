<?php

namespace Tests\Feature\E2E;

use App\Models\PatientConsent;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E15_ChildProfileAndConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_e15_child_profile_requires_guardian_consent_and_returns_masked_data(): void
    {
        // Setup: Khởi tạo tài khoản bệnh nhân mới
        $patientUser = User::factory()->create([
            'role' => 'patient',
        ]);
        Sanctum::actingAs($patientUser);

        $childDob = now()->subYears(8)->format('Y-m-d');

        // BƯỚC 1: Thử lưu hồ sơ trẻ em (< 16 tuổi) mà KHÔNG có thông tin người giám hộ -> Lỗi 422
        $responseNoGuardian = $this->postJson('/api/patient-profiles', [
            'full_name' => 'Nguyễn Văn Bé',
            'dob' => $childDob,
            'gender' => 'male',
            'relationship' => 'Con',
            'consent_agreed' => true,
        ]);

        $responseNoGuardian->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone', 'guardian_relationship']);

        // BƯỚC 2: Thử lưu hồ sơ có người giám hộ nhưng KHÔNG có Consent -> Lỗi 422
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

        // BƯỚC 3: Cung cấp đầy đủ thông tin giám hộ + BHYT + Đồng ý điều khoản -> Thành công HTTP 201
        $validPayload = [
            'full_name' => 'Nguyễn Văn Bé',
            'dob' => $childDob,
            'gender' => 'male',
            'relationship' => 'Con',
            'identity_card_number' => '001099123456',
            'phone' => '0912345678',
            'health_insurance_code' => 'DN4010123456789',
            'guardian_name' => 'Nguyễn Văn Cha',
            'guardian_phone' => '0901234567',
            'guardian_relationship' => 'Bố',
            'consent_agreed' => true,
        ];

        $responseSuccess = $this->postJson('/api/patient-profiles', $validPayload);

        $responseSuccess->assertStatus(201);
        $createdId = $responseSuccess->json('data.id');

        // BƯỚC 4: Kiểm tra bản ghi bằng chứng Consent trong CSDL (đúng 1 bản ghi)
        $this->assertEquals(
            1,
            PatientConsent::where('patient_profile_id', $createdId)->count(),
            'Kỳ vọng chỉ tồn tại đúng 1 bản ghi consent cho hồ sơ này.'
        );

        $this->assertDatabaseHas('patient_consents', [
            'user_id' => $patientUser->id,
            'patient_profile_id' => $createdId,
            'is_agreed' => true,
            'revoked_at' => null,
        ]);

        // BƯỚC 5: Kiểm tra dữ liệu nhạy cảm được che mờ (Masked): CCCD, BHYT, SĐT
        $responseData = $responseSuccess->json('data');

        // CCCD: che mờ
        $this->assertNotEquals('001099123456', $responseData['identity_card_number']);
        $this->assertStringContainsString('****', $responseData['identity_card_number']);

        // SĐT bệnh nhân: che mờ
        $this->assertNotEquals('0912345678', $responseData['phone']);
        $this->assertStringContainsString('*****', $responseData['phone']);

        // SĐT giám hộ: che mờ
        $this->assertNotEquals('0901234567', $responseData['guardian_phone']);
        $this->assertStringContainsString('*****', $responseData['guardian_phone']);

        // BHYT: che mờ
        $this->assertNotEquals('DN4010123456789', $responseData['health_insurance_code']);
        $this->assertStringContainsString('*****', $responseData['health_insurance_code']);

        // BƯỚC 6: Kiểm tra hàm makePatientSnapshot(profile)
        $profile = PatientProfile::findOrFail($createdId);
        $snapshot = $profile->makePatientSnapshot();

        $this->assertEquals($createdId, $snapshot['profile_id']);
        $this->assertStringContainsString('****', $snapshot['identity_card_number']);
        $this->assertStringContainsString('*****', $snapshot['phone']);
        $this->assertStringContainsString('*****', $snapshot['health_insurance_code']);
    }
}
