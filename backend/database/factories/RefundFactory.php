<?php

namespace Database\Factories;

use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RefundFactory extends Factory
{
    protected $model = Refund::class;

    public function definition(): array
    {
        return [
            'payment_id' => Payment::factory(),
            'booking_id' => Booking::factory(),
            'amount' => 200000,
            'exam_fee_refunded' => 200000,
            'service_fee_refunded' => 0,
            'policy_case' => 'early_cancel',
            'reason' => 'Bệnh nhân bận công việc',
            'status' => RefundStatus::Requested,
            'refund_ref' => 'REF' . strtoupper(Str::random(16)),
            'requested_by' => User::factory(),
            'approved_by' => null,
            'requested_at' => now(),
            'processed_at' => null,
        ];
    }
}
