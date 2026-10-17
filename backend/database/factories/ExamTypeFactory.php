<?php

namespace Database\Factories;

use App\Models\ExamType;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamType>
 */
class ExamTypeFactory extends Factory
{
    protected $model = ExamType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'name' => fake()->randomElement([
                'Kham tong quat',
                'Xet nghiem mau co ban',
                'Sieu am bung tong quat',
                'Chup X-quang nguc',
                'Chup cong huong tu MRI',
            ]),
            'price' => fake()->numberBetween(100000, 1500000),
        ];
    }
}
