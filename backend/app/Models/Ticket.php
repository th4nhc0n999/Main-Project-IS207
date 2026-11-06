<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'ticket_code',
        'qr_token',
        'queue_scope',
        'queue_seq',
        'queue_number',
        'status',
        'checked_in_at',
        'checked_in_by',
    ];

    protected $casts = [
        'queue_seq' => 'integer',
        'checked_in_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function checkedInUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}
