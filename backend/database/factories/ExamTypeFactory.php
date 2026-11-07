<?php

namespace Database\Factories;

use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExamTypeFactory extends Factory
{
    protected $model = ExamType::class;

    public function definition(): array
    {
        return [
            'hospital_id' => Hospital::factory(),
            'specialty_id' => Specialty::factory(),
            'name' => 'Khám tổng quát ' . fake()->word(),
            'price' => 200000,
        ];
    }
}
