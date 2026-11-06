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

    protected $table = 'patient_profiles';

    protected $fillable = [
        'user_id',
        'full_name',
        'dob',
        'gender',
        'phone',
        'relationship',
        'identity_card_number',
        'health_insurance_code',
        'guardian_name',
        'guardian_phone',
        'guardian_relationship',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'is_default' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'patient_profile_id');
    }

    /**
     * Bằng chứng đồng ý điều khoản (Không ràng buộc khóa ngoại cứng)
     */
    public function consents(): HasMany
    {
        return $this->hasMany(PatientConsent::class, 'patient_profile_id');
    }
}
