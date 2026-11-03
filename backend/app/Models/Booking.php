<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'patient_profile_id',
        'booking_type',
        'doctor_id',
        'hospital_id',
        'exam_type_id',
        'slot_id',
        'symptoms',
        'patient_snapshot',
        'status',
        'hold_expires_at',
        'approval_expires_at',
        'decided_by',
        'decided_at',
        'reject_reason',
        'cancelled_at',
        'cancelled_by',
        'cancel_reason_code',
        'cancel_reason',
        'request_key',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'patient_snapshot' => 'array',
            'hold_expires_at' => 'datetime',
            'approval_expires_at' => 'datetime',
            'decided_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'version' => 'integer',
        ];
    }
}