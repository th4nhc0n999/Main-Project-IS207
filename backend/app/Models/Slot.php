<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Slot extends Model
{
    use HasFactory;

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

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class, 'specialty_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'slot_id');
    }
}
