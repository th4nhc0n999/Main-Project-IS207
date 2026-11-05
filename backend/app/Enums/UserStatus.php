<?php

namespace App\Enums;

enum UserStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case LOCKED = 'locked';
    case DISABLED = 'disabled';
}