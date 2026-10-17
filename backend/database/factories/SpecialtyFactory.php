<?php

namespace Database\Factories;

use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Specialty>
 */
class SpecialtyFactory extends Factory
{
    protected $model = Specialty::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Noi tong quat',
                'Nhi khoa',
                'Tim mach',
                'Da lieu',
                'Than kinh',
                'Mat',
            ]),
            'image' => null,
        ];
    }
}
