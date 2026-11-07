<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hospital extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'address',
        'city',
        'latitude',
        'longitude',
        'hotline',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'deleted_at' => 'datetime',
        ];
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class, 'hospital_id');
    }

    public function examTypes(): HasMany
    {
        return $this->hasMany(ExamType::class, 'hospital_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class, 'hospital_id');
    }
}
