<?php

namespace App\Models;

use App\Support\DataMasker;
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

    /**
     * Hàm makePatientSnapshot(profile) trả JSON đã che cho Hoài Bảo và Tuấn Anh
     */
    public function makePatientSnapshot(): array
    {
        return [
            'profile_id' => $this->id,
            'full_name' => $this->full_name,
            'dob' => $this->dob?->format('Y-m-d'),
            'gender' => $this->gender,
            'relationship' => $this->relationship,
            'phone' => DataMasker::maskPhone($this->phone),
            'identity_card_number' => DataMasker::maskIdentityCard($this->identity_card_number),
            'health_insurance_code' => DataMasker::maskHealthInsurance($this->health_insurance_code),
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => DataMasker::maskPhone($this->guardian_phone),
            'guardian_relationship' => $this->guardian_relationship,
            'captured_at' => now()->toIso8601String(),
        ];
    }
}
