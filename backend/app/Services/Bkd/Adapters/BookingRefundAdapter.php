<?php

namespace App\Services\Bkd\Adapters;

use App\Contracts\Bkd\BookingRefund;
use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\User;
use App\Services\RefundService;

class BookingRefundAdapter implements BookingRefund
{
    public function __construct(private RefundService $refunds) {}

    public function requestFor(Booking $booking, BookingEvent $event, User $actor): void
    {
        // Keep the service's stable event reference; never create a second ref.
        $this->refunds->forBookingEvent($booking, $event, $actor, [
            'reason' => $event === BookingEvent::T06 ? $booking->reject_reason : $booking->cancel_reason,
            'reason_code' => $booking->cancel_reason_code,
        ]);
    }
}
