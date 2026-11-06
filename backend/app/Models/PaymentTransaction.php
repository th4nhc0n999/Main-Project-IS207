<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'transaction_code',
        'gateway',
        'amount',
        'status',
        'source',
        'raw_payload',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'raw_payload' => 'array',
        'paid_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
