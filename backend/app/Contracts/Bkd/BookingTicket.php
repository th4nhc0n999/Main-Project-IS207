<?php

namespace App\Contracts\Bkd;

use App\Models\Booking;

interface BookingTicket
{
    /** Issue one ticket/STT/QR through Tuấn Anh's service in the same transaction. */
    public function issueFor(Booking $booking): void;
}
