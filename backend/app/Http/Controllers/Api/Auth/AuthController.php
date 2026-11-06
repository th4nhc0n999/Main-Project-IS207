<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\AuditEvent;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Handle patient registration (AU-01).
     */
    public function register(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => 'patient',
            'status' => UserStatus::ACTIVE,
            'hospital_id' => null,
            'failed_login_count' => 0,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $auditLogger->log(
            AuditEvent::AU_01,
            'user',
            $user->id,
            $user,
            ['email' => $user->email, 'role' => 'patient'],
            'Bệnh nhân đăng ký tài khoản mới'
        );

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => 'active',
            'hospital_id' => null,
        ];

        return response()->json([
            'message' => 'Đăng ký tài khoản thành công.',
            'token' => $token,
            'user' => $userData,
            'data' => [
                'token' => $token,
                'user' => $userData,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Handle user login with rate limiting (5 attempts in 60s) and 15-minute lockout (S4-11, E16).
     */
    public function login(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($validated['email']));
        $rateLimitKey = 'login_rate:'.md5($email);
        $user = User::query()->where('email', $email)->first();

        // Check if user is locked
        if ($user) {
            $userStatus = $user->status instanceof UserStatus ? $user->status : UserStatus::from((string) $user->status);

            if ($userStatus === UserStatus::LOCKED) {
                if ($user->locked_until && now()->lt($user->locked_until)) {
                    $remainingMinutes = (int) ceil(now()->diffInSeconds($user->locked_until) / 60);

                    $auditLogger->log(
                        AuditEvent::AU_03,
                        'user',
                        $user->id,
                        $user,
                        ['email' => $email, 'remaining_minutes' => $remainingMinutes],
                        'Thử đăng nhập khi tài khoản đang bị khóa'
                    );

                    return response()->json([
                        'message' => "Tài khoản đang bị tạm khóa. Vui lòng thử lại sau {$remainingMinutes} phút.",
                        'status' => 'locked',
                        'remaining_minutes' => $remainingMinutes,
                    ], Response::HTTP_FORBIDDEN);
                }

                // Lock time has expired: auto-unlock
                $user->status = UserStatus::ACTIVE;
                $user->locked_until = null;
                $user->failed_login_count = 0;
                $user->save();
                RateLimiter::clear($rateLimitKey);
            }

            if ($userStatus === UserStatus::DISABLED) {
                return response()->json([
                    'message' => 'Tài khoản đã bị vô hiệu hóa.',
                    'status' => 'disabled',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Validate password
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($rateLimitKey, (int) config('medsi.login_window_seconds', 60));
            $attempts = RateLimiter::attempts($rateLimitKey);

            if ($user) {
                $user->failed_login_count = ((int) $user->failed_login_count) + 1;

                if ($attempts >= (int) config('medsi.login_max_attempts', 5) || $user->failed_login_count >= 5) {
                    $lockMinutes = (int) config('medsi.lock_minutes', 15);
                    $user->status = UserStatus::LOCKED;
                    $user->locked_until = now()->addMinutes($lockMinutes);
                    $user->failed_login_count = 5;
                    $user->save();

                    // Revoke all tokens
                    $user->tokens()->delete();

                    $auditLogger->log(
                        AuditEvent::AU_03,
                        'user',
                        $user->id,
                        $user,
                        ['event' => 'account_locked', 'attempts' => $attempts, 'lock_minutes' => $lockMinutes],
                        'Khóa tài khoản 15 phút do nhập sai mật khẩu 5 lần'
                    );

                    return response()->json([
                        'message' => "Tài khoản đã bị tạm khóa do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau {$lockMinutes} phút.",
                        'status' => 'locked',
                        'remaining_minutes' => $lockMinutes,
                    ], Response::HTTP_FORBIDDEN);
                }

                $user->save();
            }

            $auditLogger->log(
                AuditEvent::AU_03,
                'user',
                $user?->id,
                $user,
                ['email' => $email, 'attempts' => $attempts],
                'Đăng nhập thất bại do sai mật khẩu hoặc tài khoản không tồn tại'
            );

            // Generic error message without revealing if email exists
            return response()->json([
                'message' => 'Thông tin đăng nhập không chính xác.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Login successful
        RateLimiter::clear($rateLimitKey);
        $user->failed_login_count = 0;
        $user->locked_until = null;
        $user->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        $auditLogger->log(
            AuditEvent::AU_02,
            'user',
            $user->id,
            $user,
            ['role' => $user->role, 'status' => (string) $user->status->value],
            'Đăng nhập thành công'
        );

        $isPending = ($user->status === UserStatus::PENDING || (string) $user->status === 'pending');

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status instanceof UserStatus ? $user->status->value : $user->status,
            'hospital_id' => $user->hospital_id,
            'require_password_change' => $isPending,
        ];

        return response()->json([
            'message' => $isPending
                ? 'Đăng nhập thành công. Tài khoản cần đổi mật khẩu trong lần đầu đăng nhập.'
                : 'Đăng nhập thành công.',
            'token' => $token,
            'user' => $userData,
            'data' => [
                'token' => $token,
                'user' => $userData,
            ],
        ]);
    }

    /**
     * Get the authenticated user's profile (AU-02 session check).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status instanceof UserStatus ? $user->status->value : $user->status,
            'hospital_id' => $user->hospital_id,
        ];

        return response()->json([
            'user' => $userData,
            'data' => [
                'user' => $userData,
            ],
        ]);
    }

    /**
     * Handle user logout (AU-04).
     */
    public function logout(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()?->delete();

            $auditLogger->log(
                AuditEvent::AU_04,
                'user',
                $user->id,
                $user,
                ['email' => $user->email],
                'Đăng xuất hệ thống'
            );
        }

        return response()->json(['message' => 'Đăng xuất thành công.']);
    }

    /**
     * Handle first-time login password change to activate doctor/user account (S4-12, AU-05).
     */
    public function firstLoginChangePassword(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không chính xác.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->status = UserStatus::ACTIVE;
        $user->save();

        $auditLogger->log(
            AuditEvent::AU_05,
            'user',
            $user->id,
            $user,
            ['status' => 'active'],
            'Đổi mật khẩu lần đầu thành công, kích hoạt tài khoản'
        );

        return response()->json([
            'message' => 'Đổi mật khẩu thành công. Tài khoản đã được kích hoạt.',
            'status' => 'active',
        ]);
    }
}
