<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'booking_id',
        'amount',
        'exam_fee_refunded',
        'service_fee_refunded',
        'policy_case',
        'reason',
        'status',
        'refund_ref',
        'requested_by',
        'approved_by',
        'requested_at',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'exam_fee_refunded' => 'decimal:0',
        'service_fee_refunded' => 'decimal:0',
        'requested_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function requestedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
