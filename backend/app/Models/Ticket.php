<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = ['qr_token'];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'check_in_at' => 'datetime',
            'checked_in_at' => 'datetime',
            'queue_seq' => 'integer',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function checkedInUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}
