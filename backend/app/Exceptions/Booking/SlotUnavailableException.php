<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class SlotUnavailableException extends BusinessException
{
    public function __construct(string $message = 'Khung giờ khám đã hết chỗ hoặc không khả dụng')
    {
        parent::__construct($message, 422);
    }
}
