<?php

namespace App\Contracts\Bkd;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\User;

interface BookingRefund
{
    /** Create one requested refund via Khôi's RefundService in the same transaction. */
    public function requestFor(Booking $booking, BookingEvent $event, User $actor): void;
}
