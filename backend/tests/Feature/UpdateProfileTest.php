<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdateProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/user', [
            'name' => 'Tên Mới',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_update_name_and_phone(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'name'  => 'Tên Cũ',
            'email' => 'user@example.com',
            'phone' => '0901234567',
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/user', [
            'name'  => 'Nguyễn Văn Mới',
            'phone' => '0987654321',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Cập nhật thông tin tài khoản thành công',
            ])
            ->assertJsonPath('data.name', 'Nguyễn Văn Mới')
            ->assertJsonPath('data.phone', '0987654321');

        $this->assertDatabaseHas('users', [
            'id'    => $user->id,
            'name'  => 'Nguyễn Văn Mới',
            'phone' => '0987654321',
        ]);
    }

    public function test_user_can_keep_existing_email_without_unique_error(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'name'  => 'Tên Người Dùng',
            'email' => 'keep_email@example.com',
            'phone' => '0901234567',
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/user', [
            'name'  => 'Tên Sau Đổi',
            'email' => 'keep_email@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Cập nhật thông tin tài khoản thành công',
            ])
            ->assertJsonPath('data.email', 'keep_email@example.com');
    }

    public function test_user_cannot_update_to_an_email_used_by_another_account(): void
    {
        User::factory()->create([
            'email' => 'other@example.com',
        ]);

        /** @var User $currentUser */
        $currentUser = User::factory()->create([
            'email' => 'me@example.com',
        ]);

        Sanctum::actingAs($currentUser);

        $response = $this->putJson('/api/user', [
            'email' => 'other@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Email này đã được sử dụng bởi một tài khoản khác.');
    }

    public function test_validation_rejects_invalid_phone_number_format(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/user', [
            'phone' => '123456', // không đúng định dạng di động VN
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone'])
            ->assertJsonPath('errors.phone.0', 'Số điện thoại không hợp lệ (phải là số di động Việt Nam hợp lệ 10 số, ví dụ 0901234567 hoặc +84901234567).');
    }

    public function test_validation_rejects_empty_name_when_provided(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/user', [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonPath('errors.name.0', 'Họ và tên không được để trống.');
    }

    public function test_user_can_view_profile_info(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'name'  => 'Nguyễn Văn Test',
            'email' => 'testuser@example.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lấy thông tin tài khoản thành công',
            ])
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Nguyễn Văn Test');
    }
}
