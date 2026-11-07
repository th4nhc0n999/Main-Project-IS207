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
        'amount',
        'status',
        'source',
        'received_at',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:0',
            'received_at' => 'datetime',
            'raw_payload' => 'array',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }
}
