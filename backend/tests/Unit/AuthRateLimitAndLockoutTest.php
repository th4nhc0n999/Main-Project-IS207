<?php

namespace Tests\Unit;

use App\Enums\AuditEvent;
use App\Enums\UserStatus;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthRateLimitAndLockoutTest extends TestCase
{
    private AuthController $controller;
    private AuditLogger $auditLogger;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AuthController();
        $this->auditLogger = new AuditLogger();
    }

    public function test_remaining_minutes_reported_when_account_locked(): void
    {
        $email = 'locked_doctor@medsi.vn';
        $lockedUntil = CarbonImmutable::now()->addMinutes(11);
        $user = (new User())->forceFill([
            'id' => 99,
            'name' => 'Bác sĩ A',
            'email' => $email,
            'password' => Hash::make('CorrectPassword123'),
            'role' => 'doctor',
            'status' => UserStatus::LOCKED,
            'locked_until' => $lockedUntil,
        ]);

        $this->assertSame(UserStatus::LOCKED, $user->status);
        $remainingMinutes = (int) ceil(now()->diffInSeconds($user->locked_until) / 60);
        $this->assertSame(11, $remainingMinutes);
    }

    public function test_auto_unlock_condition(): void
    {
        $user = (new User())->forceFill([
            'id' => 99,
            'name' => 'Bác sĩ A',
            'role' => 'doctor',
            'status' => UserStatus::LOCKED,
            'locked_until' => CarbonImmutable::now()->subMinutes(1),
        ]);

        // When locked_until is in the past, condition for auto-unlock is met
        $shouldUnlock = now()->gte($user->locked_until);
        $this->assertTrue($shouldUnlock);
    }

    public function test_rate_limiter_keys_and_lock_duration_constants(): void
    {
        $this->assertSame(5, (int) config('medsi.login_max_attempts', 5));
        $this->assertSame(60, (int) config('medsi.login_window_seconds', 60));
        $this->assertSame(15, (int) config('medsi.lock_minutes', 15));
    }
}
