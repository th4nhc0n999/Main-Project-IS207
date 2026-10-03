<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PatientProfile\PatientProfileRequest;
use App\Models\PatientProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientProfileController extends Controller
{
    /**
     * Lấy danh sách hồ sơ bệnh nhân của người dùng đang đăng nhập.
     *
     * GET /api/patient-profiles
     */
    public function index(Request $request): JsonResponse
    {
        $profiles = PatientProfile::where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách hồ sơ bệnh nhân thành công',
            'data'    => $profiles,
        ]);
    }

    /**
     * Tạo mới một hồ sơ bệnh nhân thuộc tài khoản người dùng hiện tại.
     *
     * POST /api/patient-profiles
     */
    public function store(PatientProfileRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $profile = PatientProfile::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo hồ sơ bệnh nhân thành công',
            'data'    => $profile,
        ], 201);
    }

    /**
     * Xem chi tiết một hồ sơ bệnh nhân.
     *
     * GET /api/patient-profiles/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $profile = PatientProfile::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân hoặc bạn không có quyền truy cập',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết hồ sơ bệnh nhân thành công',
            'data'    => $profile,
        ]);
    }

    /**
     * Cập nhật thông tin hồ sơ bệnh nhân.
     *
     * PUT/PATCH /api/patient-profiles/{id}
     */
    public function update(PatientProfileRequest $request, int $id): JsonResponse
    {
        $profile = PatientProfile::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân hoặc bạn không có quyền chỉnh sửa',
            ], 404);
        }

        $profile->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ bệnh nhân thành công',
            'data'    => $profile->fresh(),
        ]);
    }

    /**
     * Xóa hồ sơ bệnh nhân.
     *
     * DELETE /api/patient-profiles/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $profile = PatientProfile::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân hoặc bạn không có quyền xóa',
            ], 404);
        }

        // Kiểm tra nếu hồ sơ đã gắn liền với lịch khám nào đó (khóa ngoại restrictOnDelete)
        if ($profile->bookings()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa hồ sơ bệnh nhân này do đã có lịch khám trong hệ thống.',
            ], 422);
        }

        $profile->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa hồ sơ bệnh nhân thành công',
        ]);
    }
}
