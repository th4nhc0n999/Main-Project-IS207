<?php

namespace App\Exceptions\Booking;

use RuntimeException;

class TicketException extends RuntimeException
{
    public function __construct(string $message, public readonly string $errorCode = 'EX-TKT-01', public readonly int $httpStatus = 422)
    {
        parent::__construct($message);
    }
}
