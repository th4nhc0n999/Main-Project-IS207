<?php

namespace Tests\Unit;

use App\Enums\UserStatus;
use App\Http\Middleware\EnsureStaffHospitalScope;
use App\Http\Middleware\EnsureUserActive;
use App\Http\Middleware\EnsureUserRole;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Tests\TestCase;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareTest extends TestCase
{
    public function test_ensure_user_role_allows_authorized_role(): void
    {
        $middleware = new EnsureUserRole();
        $user = (new User())->forceFill(['id' => 1, 'role' => 'admin']);
        $request = Request::create('/api/admin/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200), 'admin');
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_ensure_user_role_blocks_unauthorized_role(): void
    {
        $middleware = new EnsureUserRole();
        $user = (new User())->forceFill(['id' => 2, 'role' => 'doctor']);
        $request = Request::create('/api/admin/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200), 'admin');
        $this->assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
    }

    public function test_ensure_user_role_returns_unauthorized_when_not_logged_in(): void
    {
        $middleware = new EnsureUserRole();
        $request = Request::create('/api/admin/test', 'GET');

        $response = $middleware->handle($request, fn () => new Response('OK', 200), 'admin');
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }

    public function test_ensure_user_active_blocks_pending_user_on_protected_routes(): void
    {
        $middleware = new EnsureUserActive();
        $user = (new User())->forceFill(['id' => 3, 'role' => 'doctor', 'status' => UserStatus::PENDING]);
        $request = Request::create('/api/doctor/bookings', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
    }

    public function test_ensure_user_active_allows_pending_user_on_password_change(): void
    {
        $middleware = new EnsureUserActive();
        $user = (new User())->forceFill(['id' => 3, 'role' => 'doctor', 'status' => UserStatus::PENDING]);
        $request = Request::create('/api/auth/first-login-change-password', 'POST');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_ensure_user_active_blocks_locked_user_with_remaining_time(): void
    {
        $middleware = new EnsureUserActive();
        $user = (new User())->forceFill([
            'id' => 4,
            'role' => 'patient',
            'status' => UserStatus::LOCKED,
            'locked_until' => CarbonImmutable::now()->addMinutes(12),
        ]);
        $request = Request::create('/api/patient/bookings', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
    }

    public function test_ensure_user_active_blocks_disabled_user(): void
    {
        $middleware = new EnsureUserActive();
        $user = (new User())->forceFill(['id' => 5, 'role' => 'patient', 'status' => UserStatus::DISABLED]);
        $request = Request::create('/api/patient/bookings', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
    }

    public function test_ensure_staff_hospital_scope_blocks_staff_without_hospital(): void
    {
        $middleware = new EnsureStaffHospitalScope();
        $user = (new User())->forceFill(['id' => 6, 'role' => 'staff', 'hospital_id' => null]);
        $request = Request::create('/api/staff/bookings/1/check-in', 'POST');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
    }

    public function test_ensure_staff_hospital_scope_allows_staff_with_hospital(): void
    {
        $middleware = new EnsureStaffHospitalScope();
        $user = (new User())->forceFill(['id' => 7, 'role' => 'staff', 'hospital_id' => 2]);
        $request = Request::create('/api/staff/bookings/1/check-in', 'POST');
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, fn () => new Response('OK', 200));
        $this->assertSame(200, $response->getStatusCode());
    }
}
