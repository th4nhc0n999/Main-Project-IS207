<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class InvalidSlotException extends BusinessException
{
    public function __construct(string $message = 'Khung giờ khám không tồn tại hoặc không thuộc cơ sở bệnh viện này')
    {
        parent::__construct($message, 422);
    }
}
