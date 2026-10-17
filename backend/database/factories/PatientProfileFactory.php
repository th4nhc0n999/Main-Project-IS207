<?php

namespace Database\Factories;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientProfile>
 */
class PatientProfileFactory extends Factory
{
    protected $model = PatientProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'full_name' => fake()->randomElement([
                'Nguyen Van An',
                'Tran Thi Binh',
                'Le Minh Chau',
                'Pham Quoc Dung',
            ]),
            'dob' => fake()->dateTimeBetween('-80 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'phone' => fake()->numerify('09########'),
            'relationship' => fake()->randomElement(['Cha', 'Mẹ', 'Con', 'Chồng', 'Vợ', 'Khác']),
        ];
    }
}
