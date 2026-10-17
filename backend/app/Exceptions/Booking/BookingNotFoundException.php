<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class BookingNotFoundException extends BusinessException
{
    public function __construct(string $message = 'Không tìm thấy thông tin phiếu khám')
    {
        parent::__construct($message, 404);
    }
}
