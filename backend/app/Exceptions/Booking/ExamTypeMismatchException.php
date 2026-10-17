<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class ExamTypeMismatchException extends BusinessException
{
    public function __construct(string $message = 'Dịch vụ khám không tồn tại hoặc không thuộc quyền quản lý của bệnh viện')
    {
        parent::__construct($message, 422);
    }
}
