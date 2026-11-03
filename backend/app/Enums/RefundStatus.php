<?php

namespace App\Enums;

enum RefundStatus: string
{
    case REQUESTED = 'requested';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case REJECTED = 'rejected';
    case FAILED = 'failed';
    case SUCCEEDED = 'succeeded';
}