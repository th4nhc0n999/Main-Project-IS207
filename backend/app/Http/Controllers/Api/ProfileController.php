<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Lấy thông tin tài khoản của user đang đăng nhập.
     *
     * GET /api/user
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin tài khoản thành công',
            'data' => $request->user(),
        ]);
    }

    /**
     * Cập nhật thông tin tài khoản của user đang đăng nhập.
     *
     * PUT /api/user
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $updatedUser = $this->authService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin tài khoản thành công',
            'data' => $updatedUser,
        ]);
    }
}
