<?php

namespace Database\Factories;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hospital>
 */
class HospitalFactory extends Factory
{
    protected $model = Hospital::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Benh vien Da khoa An Tam',
                'Benh vien MedSi Thanh Pho',
                'Phong kham Minh Chau',
            ]),
            'description' => fake()->randomElement([
                'Co so kham chua benh da khoa.',
                'Cung cap dich vu kham va dieu tri chat luong cao.',
                'Doi ngu bac si giau kinh nghiem.',
            ]),
            'address' => fake()->randomElement([
                '25 Le Loi, Quan 1',
                '80 Nguyen Trai, Quan 5',
                '12 Nguyen Hue, Quan Hai Chau',
            ]),
            'city' => fake()->randomElement(['Ho Chi Minh', 'Ha Noi', 'Da Nang']),
            'hotline' => fake()->numerify('028########'),
            'image' => null,
        ];
    }
}
