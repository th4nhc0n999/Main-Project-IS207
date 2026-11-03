<?php

namespace App\Exceptions\Booking;

use DomainException;

class SlotUnavailableException extends DomainException
{
    public const ERROR_CODE = 'SE001';

    public function errorCode(): string
    {
        return self::ERROR_CODE;
    }
}