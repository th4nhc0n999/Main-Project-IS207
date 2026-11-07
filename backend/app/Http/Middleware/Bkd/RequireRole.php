<?php

namespace App\Http\Middleware\Bkd;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        if (! $user || $user->status !== UserStatus::ACTIVE || ! in_array($user->role, $roles, true)) {
            throw new AuthorizationException;
        }

        return $next($request);
    }
}
