<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $status = $user->status instanceof UserStatus ? $user->status : UserStatus::from((string) $user->status);

        // Status is pending: user must change password first
        if ($status === UserStatus::PENDING) {
            // Allow password change routes and logout
            if (! $request->is('api/auth/first-login-change-password') && ! $request->is('api/auth/logout')) {
                return response()->json([
                    'message' => 'Tài khoản cần đổi mật khẩu trong lần đầu đăng nhập.',
                    'status' => 'pending',
                    'require_password_change' => true,
                ], Response::HTTP_FORBIDDEN);
            }

            return $next($request);
        }

        // Status is locked: check if lock duration expired
        if ($status === UserStatus::LOCKED) {
            if ($user->locked_until && now()->lt($user->locked_until)) {
                $remainingMinutes = (int) ceil(now()->diffInSeconds($user->locked_until) / 60);
                return response()->json([
                    'message' => "Tài khoản đang bị tạm khóa. Vui lòng thử lại sau {$remainingMinutes} phút.",
                    'status' => 'locked',
                    'remaining_minutes' => $remainingMinutes,
                ], Response::HTTP_FORBIDDEN);
            }

            // Lock has expired -> auto-unlock
            $user->status = UserStatus::ACTIVE;
            $user->locked_until = null;
            $user->failed_login_count = 0;
            $user->save();
        }

        // Status is disabled
        if ($status === UserStatus::DISABLED) {
            return response()->json([
                'message' => 'Tài khoản đã bị vô hiệu hóa.',
                'status' => 'disabled',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

