<?php

namespace App\Exceptions\Booking;

use App\Exceptions\BusinessException;

class BookingCannotBeCancelledException extends BusinessException
{
    public function __construct(string $message = 'Chỉ có thể hủy phiếu khám ở trạng thái chờ duyệt (pending).')
    {
        parent::__construct($message, 422);
    }
}
