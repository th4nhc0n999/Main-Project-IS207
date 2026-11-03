<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Slot extends Model
{
    protected $fillable = [
        'owner_type',
        'owner_id',
        'specialty_id',
        'work_date',
        'start_time',
        'end_time',
        'capacity',
        'booked_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'capacity' => 'integer',
            'booked_count' => 'integer',
        ];
    }
}