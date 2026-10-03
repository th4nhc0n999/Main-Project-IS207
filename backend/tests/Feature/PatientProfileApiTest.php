<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PatientProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_patient_profiles_api(): void
    {
        $response = $this->getJson('/api/patient-profiles');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_list_only_their_patient_profiles(): void
    {
        /** @var User $userA */
        $userA = User::factory()->create();
        /** @var User $userB */
        $userB = User::factory()->create();

        PatientProfile::factory()->create([
            'user_id'   => $userA->id,
            'full_name' => 'Profile A1',
        ]);
        PatientProfile::factory()->create([
            'user_id'   => $userA->id,
            'full_name' => 'Profile A2',
        ]);
        PatientProfile::factory()->create([
            'user_id'   => $userB->id,
            'full_name' => 'Profile B1',
        ]);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/patient-profiles');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lấy danh sách hồ sơ bệnh nhân thành công',
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_create_patient_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'full_name'    => 'Nguyễn Văn Con',
            'dob'          => '2015-05-10',
            'gender'       => 'male',
            'phone'        => '0901234567',
            'relationship' => 'Con trai',
        ];

        $response = $this->postJson('/api/patient-profiles', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Tạo hồ sơ bệnh nhân thành công',
            ])
            ->assertJsonPath('data.full_name', 'Nguyễn Văn Con')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('patient_profiles', [
            'user_id'      => $user->id,
            'full_name'    => 'Nguyễn Văn Con',
            'relationship' => 'Con trai',
        ]);
    }

    public function test_create_patient_profile_validates_required_fields(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/patient-profiles', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['full_name', 'dob', 'gender', 'relationship']);
    }

    public function test_user_can_view_single_patient_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create([
            'user_id'   => $user->id,
            'full_name' => 'Hồ sơ của tôi',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/patient-profiles/{$profile->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.full_name', 'Hồ sơ của tôi');
    }

    public function test_user_cannot_view_other_users_patient_profile(): void
    {
        /** @var User $userA */
        $userA = User::factory()->create();
        /** @var User $userB */
        $userB = User::factory()->create();

        $profileB = PatientProfile::factory()->create(['user_id' => $userB->id]);

        Sanctum::actingAs($userA);

        $response = $this->getJson("/api/patient-profiles/{$profileB->id}");

        $response->assertStatus(404);
    }

    public function test_user_can_update_own_patient_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create([
            'user_id'   => $user->id,
            'full_name' => 'Tên Ban Đầu',
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/patient-profiles/{$profile->id}", [
            'full_name' => 'Tên Đã Chỉnh Sửa',
            'phone'     => '0987654321',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Cập nhật hồ sơ bệnh nhân thành công',
            ])
            ->assertJsonPath('data.full_name', 'Tên Đã Chỉnh Sửa')
            ->assertJsonPath('data.phone', '0987654321');

        $this->assertDatabaseHas('patient_profiles', [
            'id'        => $profile->id,
            'full_name' => 'Tên Đã Chỉnh Sửa',
        ]);
    }

    public function test_user_can_delete_patient_profile_without_bookings(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create(['user_id' => $user->id]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/patient-profiles/{$profile->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Xóa hồ sơ bệnh nhân thành công',
            ]);

        $this->assertDatabaseMissing('patient_profiles', ['id' => $profile->id]);
    }

    public function test_cannot_delete_patient_profile_with_existing_bookings(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create(['user_id' => $user->id]);

        $specialty = Specialty::create(['name' => 'Nhi khoa']);
        $doctor = Doctor::create([
            'specialty_id' => $specialty->id,
            'name'         => 'BS. Test',
            'city'         => 'Hồ Chí Minh',
            'address'      => '123 Đường Test',
        ]);
        $slot = Slot::create([
            'owner_type' => 'doctor',
            'owner_id'   => $doctor->id,
            'work_date'  => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time'   => '09:30',
            'capacity'   => 1,
        ]);

        Booking::create([
            'user_id'            => $user->id,
            'patient_profile_id' => $profile->id,
            'booking_type'       => 'doctor',
            'doctor_id'          => $doctor->id,
            'slot_id'            => $slot->id,
            'status'             => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/patient-profiles/{$profile->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Không thể xóa hồ sơ bệnh nhân này do đã có lịch khám trong hệ thống.',
            ]);

        $this->assertDatabaseHas('patient_profiles', ['id' => $profile->id]);
    }
}
