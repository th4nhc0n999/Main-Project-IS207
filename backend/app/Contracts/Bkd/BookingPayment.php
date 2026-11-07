<?php

namespace App\Contracts\Bkd;

use App\Models\Booking;

interface BookingPayment
{
    /**
     * Hand off to Khôi's PaymentService in the caller's DB transaction.
     * The existing state machine already inserts payments: adopt that row,
     * never insert a second payment, start a gateway call or commit here.
     */
    public function ensurePendingPayment(Booking $booking): void;
}
