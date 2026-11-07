<?php

namespace Database\Factories;

use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

class HospitalFactory extends Factory
{
    protected $model = Hospital::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Hospital',
            'description' => fake()->paragraph(),
            'address' => fake()->address(),
            'city' => 'Thành phố Hồ Chí Minh',
            'latitude' => fake()->latitude(10.7, 10.9),
            'longitude' => fake()->longitude(106.6, 106.8),
            'hotline' => '1900' . fake()->numerify('####'),
            'image' => null,
        ];
    }
}
