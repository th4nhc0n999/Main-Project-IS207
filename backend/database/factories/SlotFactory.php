<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\Slot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Slot>
 */
class SlotFactory extends Factory
{
    protected $model = Slot::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        [$startTime, $endTime] = fake()->randomElement([
            ['08:00:00', '09:00:00'],
            ['09:00:00', '10:00:00'],
            ['14:00:00', '15:00:00'],
            ['15:00:00', '16:00:00'],
        ]);

        return [
            'owner_type' => null,
            'owner_id' => null,
            'work_date' => fake()->dateTimeBetween('today', '+7 days')->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'available',
        ];
    }

    public function forDoctor(Doctor $doctor): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_type' => 'doctor',
            'owner_id' => $doctor->id,
            'capacity' => 1,
        ]);
    }

    public function forHospital(Hospital $hospital, int $capacity = 5): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_type' => 'hospital',
            'owner_id' => $hospital->id,
            'capacity' => $capacity,
        ]);
    }

    public function almostFull(): static
    {
        return $this->state(fn (array $attributes) => [
            'booked_count' => max(0, (int) ($attributes['capacity'] ?? 1) - 1),
            'status' => 'available',
        ]);
    }

    public function full(): static
    {
        return $this->state(fn (array $attributes) => [
            'booked_count' => (int) ($attributes['capacity'] ?? 1),
            'status' => 'full',
        ]);
    }

    public function blocked(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'blocked',
        ]);
    }

    public function inPast(): static
    {
        return $this->state(fn (array $attributes) => [
            'work_date' => fake()->dateTimeBetween('-30 days', '-1 day')->format('Y-m-d'),
        ]);
    }
}
