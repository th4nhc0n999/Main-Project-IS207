<?php

namespace Tests\Unit;

use App\Enums\AuditEvent;
use App\Services\AuditLogger;
use PHPUnit\Framework\TestCase;

class AuditLoggerTest extends TestCase
{
    public function test_sanitize_scrubs_sensitive_keys(): void
    {
        $logger = new AuditLogger();

        $input = [
            'name' => 'Nguyễn Văn A',
            'email' => 'nguyenvana@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'identity_card_number' => '012345678901',
            'cccd' => '012345678901',
            'qr_token' => 'jwt.token.string',
            'health_insurance_code' => 'DN4010123456789',
            'metadata' => [
                'user_token' => 'bearer-token-123',
                'status' => 'active',
                'nested' => [
                    'cccd_number' => '098765432109',
                ]
            ]
        ];

        $sanitized = $logger->sanitizeData($input);

        $this->assertSame('Nguyễn Văn A', $sanitized['name']);
        $this->assertSame('nguyenvana@example.com', $sanitized['email']);
        $this->assertSame('***MASKED***', $sanitized['password']);
        $this->assertSame('***MASKED***', $sanitized['password_confirmation']);
        $this->assertSame('***MASKED***', $sanitized['identity_card_number']);
        $this->assertSame('***MASKED***', $sanitized['cccd']);
        $this->assertSame('***MASKED***', $sanitized['qr_token']);
        $this->assertSame('***MASKED***', $sanitized['health_insurance_code']);
        $this->assertSame('***MASKED***', $sanitized['metadata']['user_token']);
        $this->assertSame('active', $sanitized['metadata']['status']);
        $this->assertSame('***MASKED***', $sanitized['metadata']['nested']['cccd_number']);
    }

    public function test_all_20_audit_events_are_defined(): void
    {
        $cases = AuditEvent::cases();
        $this->assertCount(20, $cases);

        $expectedValues = [
            'AU-01', 'AU-02', 'AU-03', 'AU-04', 'AU-05',
            'AU-06', 'AU-07', 'AU-08', 'AU-09', 'AU-10',
            'AU-11', 'AU-12', 'AU-13', 'AU-14', 'AU-15',
            'AU-16', 'AU-17', 'AU-18', 'AU-19', 'AU-20',
        ];

        $actualValues = array_map(fn (AuditEvent $e) => $e->value, $cases);
        $this->assertSame($expectedValues, $actualValues);
    }
}

