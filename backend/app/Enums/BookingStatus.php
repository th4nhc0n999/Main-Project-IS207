<?php

namespace App\Enums;

enum BookingStatus: string
{
    case PENDING_PAYMENT = 'pending_payment';
    case PENDING_APPROVAL = 'pending_approval';
    case CONFIRMED = 'confirmed';
    case CHECKED_IN = 'checked_in';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
    case REJECTED = 'rejected';
    case NO_SHOW = 'no_show';

    public function releasesSlot(): bool
    {
        return in_array($this, [
            self::CANCELLED,
            self::EXPIRED,
            self::REJECTED,
        ], true);
    }

    public function isActive(): bool
    {
        return in_array($this, [
            self::PENDING_PAYMENT,
            self::PENDING_APPROVAL,
            self::CONFIRMED,
            self::CHECKED_IN,
        ], true);
    }
}