<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientConsent extends Model
{
    use HasFactory;

    protected $table = 'patient_consents';

    protected $fillable = [
        'user_id',
        'patient_profile_id',
        'policy_version',
        'is_agreed',
        'agreed_at',
        'ip_address',
        'user_agent',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'is_agreed' => 'boolean',
            'agreed_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Bảng không có Foreign Key cứng nên withTrashed() giúp tìm được cả hồ sơ đã xóa mềm
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(PatientProfile::class, 'patient_profile_id')->withTrashed();
    }
}
