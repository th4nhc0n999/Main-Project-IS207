<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'specialty_id' => Specialty::factory(),
            'name' => fake()->randomElement([
                'BS. Tran Thi Binh',
                'BS. Pham Minh Chau',
                'BS. Nguyen Quoc Anh',
                'BS. Le Thanh Tung',
            ]),
            'bio' => 'Bac si co nhieu nam kinh nghiem trong linh vuc chuyen khoa.',
            'city' => fake()->randomElement(['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']),
            'address' => fake()->randomElement([
                '12 Nguyen Hue, Quan 1',
                '45 Le Thanh Ton, Quan 1',
                '18 Bach Dang, Hai Chau',
            ]),
            'avatar' => null,
        ];
    }
}
