<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'full_name',
        'relationship',
        'gender',
        'date_of_birth',
        'phone',
        'identity_card_number',
        'health_insurance_number',
        'province',
        'district',
        'ward',
        'address',
        'guardian_name',
        'guardian_phone',
        'guardian_relationship',
        'is_default',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
