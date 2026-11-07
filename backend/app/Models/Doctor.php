<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Doctor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'specialty_id',
        'hospital_id',
        'name',
        'title',
        'years_experience',
        'bio',
        'city',
        'address',
        'latitude',
        'longitude',
        'consultation_fee',
        'avatar',
    ];

    protected function casts(): array
    {
        return [
            'years_experience' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'consultation_fee' => 'decimal:0',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class, 'specialty_id');
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class, 'hospital_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'doctor_id');
    }
}
