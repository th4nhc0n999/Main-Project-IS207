<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class BookingAlreadyExistsException extends BusinessException
{
    public function __construct(string $message = 'Bệnh nhân đã có lịch khám trong khung giờ này')
    {
        parent::__construct($message, 409);
    }
}
