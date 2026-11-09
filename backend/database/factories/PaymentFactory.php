<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $examFee = 200000;
        $serviceFee = 20000;
        $discountAmount = 0;
        $totalAmount = $examFee - $discountAmount + $serviceFee;

        return [
            'booking_id' => Booking::factory(),
            'method' => 'qr_pay',
            'exam_fee' => $examFee,
            'discount_amount' => $discountAmount,
            'service_fee' => $serviceFee,
            'total_amount' => $totalAmount,
            'received_amount' => 0,
            'refunded_amount' => 0,
            'status' => PaymentStatus::PENDING,
            'paid_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::PAID,
            'received_amount' => $attributes['total_amount'],
            'paid_at' => now(),
        ]);
    }
}
