<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Slot;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

class SlotFactory extends Factory
{
    protected $model = Slot::class;

    public function definition(): array
    {
        $startHour = fake()->numberBetween(8, 16);
        $startTime = sprintf('%02d:00:00', $startHour);
        $endTime = sprintf('%02d:30:00', $startHour);

        return [
            'owner_type' => 'doctor',
            'owner_id' => Doctor::factory(),
            'specialty_id' => Specialty::factory(),
            'work_date' => fake()->dateTimeBetween('now', '+15 days')->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'available',
        ];
    }

    public function hospital(): static
    {
        return $this->state(fn () => [
            'owner_type' => 'hospital',
            'capacity' => 20,
            'start_time' => '07:30:00',
            'end_time' => '11:30:00',
        ]);
    }
}
