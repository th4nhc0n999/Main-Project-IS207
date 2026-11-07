<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

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
        return $this->belongsTo(User::class, 'user_id');
    }

    public function patientProfile(): BelongsTo
    {
        return $this->belongsTo(PatientProfile::class, 'patient_profile_id')->withTrashed();
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(Slot::class, 'slot_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id')->withTrashed();
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class, 'hospital_id')->withTrashed();
    }

    public function examType(): BelongsTo
    {
        return $this->belongsTo(ExamType::class, 'exam_type_id')->withTrashed();
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'booking_id');
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class, 'booking_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'booking_id');
    }
}
