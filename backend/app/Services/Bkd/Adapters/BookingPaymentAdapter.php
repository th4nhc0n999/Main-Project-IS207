<?php

namespace App\Services\Bkd\Adapters;

use App\Contracts\Bkd\BookingPayment;
use App\Models\Booking;
use App\Services\PaymentService;

class BookingPaymentAdapter implements BookingPayment
{
    public function __construct(private PaymentService $payments) {}

    public function ensurePendingPayment(Booking $booking): void
    {
        // T01 already called create(); its idempotent lookup adopts that row.
        $this->payments->create($booking);
    }
}
