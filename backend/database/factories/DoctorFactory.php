<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->doctor(),
            'specialty_id' => Specialty::factory(),
            'hospital_id' => Hospital::factory(),
            'name' => 'BS. ' . fake()->name(),
            'title' => 'Bác sĩ chuyên khoa I',
            'years_experience' => fake()->numberBetween(3, 25),
            'bio' => fake()->paragraph(),
            'city' => 'Thành phố Hồ Chí Minh',
            'address' => fake()->address(),
            'latitude' => fake()->latitude(10.7, 10.9),
            'longitude' => fake()->longitude(106.6, 106.8),
            'consultation_fee' => 200000,
            'avatar' => null,
        ];
    }
}
