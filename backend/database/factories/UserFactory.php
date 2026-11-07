<?php

namespace Database\Factories;

use App\Enums\UserStatus;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password123'),
            'phone' => '09' . fake()->numerify('########'),
            'role' => 'patient',
            'status' => UserStatus::ACTIVE,
            'hospital_id' => null,
            'failed_login_count' => 0,
            'locked_until' => null,
        ];
    }

    public function doctor(): static
    {
        return $this->state(fn () => [
            'role' => 'doctor',
        ]);
    }

    public function staff(?Hospital $hospital = null): static
    {
        return $this->state(fn () => [
            'role' => 'staff',
            'hospital_id' => $hospital?->id ?? Hospital::factory(),
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'role' => 'admin',
        ]);
    }
}
