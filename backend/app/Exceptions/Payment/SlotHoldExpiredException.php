<?php

namespace App\Exceptions\Payment;

use App\Exceptions\BusinessException;

class SlotHoldExpiredException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('Thời gian giữ slot khám đã hết. Không thể xác nhận thanh toán. Vui lòng đặt lại lịch khám.', 409);
    }
}
