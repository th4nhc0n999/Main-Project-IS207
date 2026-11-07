<?php

namespace App\Services\Bkd\Adapters;

use App\Contracts\Bkd\BookingTicket;
use App\Models\Booking;
use App\Services\TicketService;

class BookingTicketAdapter implements BookingTicket
{
    public function __construct(private TicketService $tickets) {}

    public function issueFor(Booking $booking): void
    {
        // T05 already issued the ticket; issue() returns it without a new STT/QR.
        $this->tickets->issue($booking);
    }
}
