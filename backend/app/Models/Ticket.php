<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $guarded = [];

    protected $hidden = ['qr_token'];

    protected function casts(): array
    {
        return ['status' => TicketStatus::class, 'check_in_at' => 'datetime', 'queue_seq' => 'integer'];
    }
}
