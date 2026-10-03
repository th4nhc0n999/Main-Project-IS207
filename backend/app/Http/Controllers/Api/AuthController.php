<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * POST /api/auth/register
     * Đăng ký tài khoản bệnh nhân mới.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->register($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký tài khoản thành công.',
                'data'    => [
                    'user'  => $this->formatUser($result['user']),
                    'token' => $result['token'],
                ],
                'errors'  => null,
            ], 201);
        } catch (BusinessException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
                'errors'  => null,
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi trong quá trình đăng ký.',
                'data'    => null,
                'errors'  => null,
            ], 500);
        }
    }

    /**
     * POST /api/auth/login
     * Xác thực và cấp Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công.',
                'data'    => [
                    'user'  => $this->formatUser($result['user']),
                    'token' => $result['token'],
                ],
                'errors'  => null,
            ]);
        } catch (InvalidCredentialsException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
                'errors'  => null,
            ], 401);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi trong quá trình đăng nhập.',
                'data'    => null,
                'errors'  => null,
            ], 500);
        }
    }

    /**
     * POST /api/auth/logout  (yêu cầu auth:sanctum)
     * Thu hồi token hiện tại của người dùng.
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công.',
                'data'    => null,
                'errors'  => null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi trong quá trình đăng xuất.',
                'data'    => null,
                'errors'  => null,
            ], 500);
        }
    }

    /**
     * GET /api/auth/me  (yêu cầu auth:sanctum)
     * Trả về thông tin người dùng đang đăng nhập.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin người dùng thành công.',
            'data'    => [
                'user' => $this->formatUser($request->user()),
            ],
            'errors'  => null,
        ]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Chỉ expose các trường an toàn của User ra ngoài client.
     * KHÔNG để lộ password / remember_token / timestamps nhạy cảm.
     */
    private function formatUser($user): array
    {
        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role'  => $user->role,
        ];
    }
}
