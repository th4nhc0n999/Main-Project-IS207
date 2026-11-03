<?php

namespace App\Enums;

enum TicketStatus: string
{
    case ISSUED = 'issued';
    case CHECKED_IN = 'checked_in';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
}