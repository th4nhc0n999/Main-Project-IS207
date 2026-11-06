<?php

namespace App\Models;

use App\Enums\TicketStatus;
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
        'room_number',
        'status',
        'check_in_at',
        'instructions',
    ];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'queue_seq' => 'integer',
            'check_in_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
