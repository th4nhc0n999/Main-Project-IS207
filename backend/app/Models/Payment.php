<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'method',
        'exam_fee',
        'discount_amount',
        'service_fee',
        'total_amount',
        'received_amount',
        'refunded_amount',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'exam_fee' => 'decimal:0',
        'discount_amount' => 'decimal:0',
        'service_fee' => 'decimal:0',
        'total_amount' => 'decimal:0',
        'received_amount' => 'decimal:0',
        'refunded_amount' => 'decimal:0',
        'paid_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }
}
