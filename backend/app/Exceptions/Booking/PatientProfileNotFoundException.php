<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class PatientProfileNotFoundException extends BusinessException
{
    public function __construct(string $message = 'Hồ sơ người bệnh không tồn tại hoặc không thuộc quyền sở hữu của bạn')
    {
        parent::__construct($message, 404);
    }
}
