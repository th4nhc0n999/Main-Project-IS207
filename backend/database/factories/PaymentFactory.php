<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $examFee = fake()->numberBetween(100000, 1500000);
        $serviceFee = fake()->numberBetween(10000, 50000);

        return [
            'booking_id' => Booking::factory()->forHospitalBooking(),
            'method' => fake()->randomElement(['atm', 'credit_card', 'qr_pay', 'store_pay', 'momo']),
            'exam_fee' => $examFee,
            'service_fee' => $serviceFee,
            'total_amount' => $examFee + $serviceFee,
            'status' => 'pending',
            'transaction_code' => null,
            'paid_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_code' => 'TXN'.fake()->unique()->numerify('##########'),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
