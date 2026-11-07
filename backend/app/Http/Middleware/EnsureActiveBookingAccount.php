<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveBookingAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->status === UserStatus::ACTIVE, 403, 'Tài khoản chưa được kích hoạt hoặc đang bị khóa.');

        return $next($request);
    }
}
