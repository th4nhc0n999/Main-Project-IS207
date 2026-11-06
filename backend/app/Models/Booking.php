<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function patientProfile(): BelongsTo
    {
        return $this->belongsTo(PatientProfile::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(Slot::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function examType(): BelongsTo
    {
        return $this->belongsTo(ExamType::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }
}
