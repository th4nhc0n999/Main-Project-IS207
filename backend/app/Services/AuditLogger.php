<?php

namespace App\Services;

use App\Enums\AuditEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AuditLogger
{
    /**
     * Keys containing sensitive data that must be scrubbed or masked from audit logs.
     *
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'identity_card_number',
        'cccd',
        'cmnd',
        'qr_token',
        'token',
        'bearer_token',
        'remember_token',
        'health_insurance_code',
        'bhyt',
    ];

    /**
     * Record an audit log entry. Only INSERT is allowed.
     *
     * @param AuditEvent|string $action Action code (e.g. AU-01..AU-20 or T01..T16)
     * @param string $entityType Entity type (e.g. 'user', 'booking', 'patient_profile', 'refund', 'payment', 'slot')
     * @param int|null $entityId Entity primary key ID
     * @param User|string|null $actor The acting user, or 'system' / 'gateway'
     * @param array<string, mixed>|null $changes Context or delta changes
     * @param string|null $reason Optional human-readable reason
     * @param string|null $ipAddress Client IP address
     * @return int The ID of the inserted audit log
     */
    public function log(
        AuditEvent|string $action,
        string $entityType,
        ?int $entityId = null,
        User|string|null $actor = null,
        ?array $changes = null,
        ?string $reason = null,
        ?string $ipAddress = null
    ): int {
        $actionValue = $action instanceof AuditEvent ? $action->value : (string) $action;

        $actorId = null;
        $actorType = 'system';

        if ($actor instanceof User) {
            $actorId = (int) $actor->getKey();
            $actorType = 'user';
        } elseif (is_string($actor)) {
            $actorLower = strtolower(trim($actor));
            if (in_array($actorLower, ['system', 'gateway', 'user'], true)) {
                $actorType = $actorLower;
            } else {
                $actorType = 'system';
            }
        } elseif ($actor === null) {
            $actorType = 'system';
        }

        $sanitizedChanges = null;
        if ($changes !== null) {
            $cleaned = $this->sanitizeData($changes);
            $sanitizedChanges = json_encode($cleaned, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }

        $trimmedReason = $reason !== null ? mb_substr(trim($reason), 0, 255) : null;
        $ip = $ipAddress ?: (function_exists('request') && request() ? request()->ip() : null);

        return (int) DB::table('audit_logs')->insertGetId([
            'actor_id' => $actorId,
            'actor_type' => $actorType,
            'action' => $actionValue,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'reason' => $trimmedReason,
            'changes' => $sanitizedChanges,
            'ip_address' => $ip,
            'occurred_at' => now(),
        ]);
    }

    /**
     * Recursively scrubs sensitive values from array data.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function sanitizeData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            if ($this->isSensitiveKey($lowerKey)) {
                $sanitized[$key] = '***MASKED***';
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Determine whether the given array key is sensitive.
     */
    private function isSensitiveKey(string $key): bool
    {
        foreach (self::SENSITIVE_KEYS as $sensitive) {
            if ($key === $sensitive || str_contains($key, $sensitive)) {
                return true;
            }
        }

        return false;
    }
}

