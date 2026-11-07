<?php

namespace Database\Factories;

use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SpecialtyFactory extends Factory
{
    protected $model = Specialty::class;

    public function definition(): array
    {
        $name = fake()->unique()->word() . ' Khoa';
        return [
            'code' => 'CK' . fake()->unique()->numerify('##'),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numerify('###'),
            'description' => fake()->sentence(),
            'default_instructions' => 'Nhịn ăn sáng trước khi xét nghiệm máu.',
            'image' => null,
        ];
    }
}
