<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DoctorRequest;
use App\Services\Admin\DoctorAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class DoctorAdminController extends Controller
{
    public function __construct(
        protected DoctorAdminService $doctorService
    ) {}

    /**
     * GET /api/admin/doctors
     * Danh sách bác sĩ, có thể lọc theo chuyên khoa.
     */
    public function index(Request $request): JsonResponse
    {
        $specialtyId = $request->query('specialty_id') ? (int) $request->query('specialty_id') : null;
        $doctors = $this->doctorService->list($specialtyId);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách bác sĩ thành công.',
            'data'    => $doctors,
        ]);
    }

    /**
     * GET /api/admin/doctors/{id}
     * Chi tiết 1 bác sĩ.
     */
    public function show(int $id): JsonResponse
    {
        $doctor = $this->doctorService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết bác sĩ thành công.',
            'data'    => $doctor,
        ]);
    }

    /**
     * POST /api/admin/doctors
     * Tạo bác sĩ mới.
     */
    public function store(DoctorRequest $request): JsonResponse
    {
        try {
            $doctor = $this->doctorService->create($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tạo bác sĩ thành công.',
                'data'    => $doctor,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }

    /**
     * PUT /api/admin/doctors/{id}
     * Cập nhật thông tin bác sĩ.
     */
    public function update(DoctorRequest $request, int $id): JsonResponse
    {
        try {
            $doctor = $this->doctorService->update($id, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bác sĩ thành công.',
                'data'    => $doctor,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }

    /**
     * DELETE /api/admin/doctors/{id}
     * Xóa bác sĩ (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->doctorService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa bác sĩ thành công.',
                'data'    => null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }
}
