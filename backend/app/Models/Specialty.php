<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialty extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'slug',
        'description',
        'default_instructions',
        'image',
    ];

    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class);
    }

    public function examTypes(): HasMany
    {
        return $this->hasMany(ExamType::class);
    }

    public function slots(): HasMany
    {
        return $this->hasMany(Slot::class);
    }
}

