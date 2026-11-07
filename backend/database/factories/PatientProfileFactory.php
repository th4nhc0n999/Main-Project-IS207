<?php

namespace Database\Factories;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientProfileFactory extends Factory
{
    protected $model = PatientProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'full_name' => fake()->name(),
            'dob' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'phone' => '09' . fake()->numerify('########'),
            'relationship' => 'Bản thân',
            'identity_card_number' => fake()->numerify('001099######'),
            'health_insurance_code' => 'DN401' . fake()->numerify('##########'),
            'guardian_name' => null,
            'guardian_phone' => null,
            'guardian_relationship' => null,
            'is_default' => false,
        ];
    }

    public function child(): static
    {
        return $this->state(fn () => [
            'dob' => now()->subYears(8)->format('Y-m-d'),
            'relationship' => 'Con',
            'guardian_name' => fake()->name(),
            'guardian_phone' => '09' . fake()->numerify('########'),
            'guardian_relationship' => 'Bố/Mẹ',
        ]);
    }

    public function defaultProfile(): static
    {
        return $this->state(fn () => [
            'is_default' => true,
        ]);
    }
}
