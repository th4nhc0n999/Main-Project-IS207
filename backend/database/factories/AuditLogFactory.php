<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'actor_id' => User::factory(),
            'actor_type' => 'user',
            'action' => 'AU-10',
            'entity_type' => 'booking',
            'entity_id' => fake()->numberBetween(1, 1000),
            'reason' => 'Patient created appointment',
            'changes' => ['status' => 'pending_payment'],
            'ip_address' => fake()->ipv4(),
            'occurred_at' => now(),
        ];
    }
}
