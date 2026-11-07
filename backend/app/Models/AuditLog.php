<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'audit_logs';

    protected $fillable = [
        'actor_id',
        'actor_type',
        'action',
        'entity_type',
        'entity_id',
        'reason',
        'changes',
        'ip_address',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
