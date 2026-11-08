<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SpecialtyRequest;
use App\Services\Admin\SpecialtyService;
use Illuminate\Http\JsonResponse;
use Throwable;

class SpecialtyController extends Controller
{
    public function __construct(
        protected SpecialtyService $specialtyService
    ) {}

    /**
     * GET /api/admin/specialties
     * Danh sách chuyên khoa (kèm số lượng bác sĩ).
     */
    public function index(): JsonResponse
    {
        $specialties = $this->specialtyService->list();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách chuyên khoa thành công.',
            'data'    => $specialties,
        ]);
    }

    /**
     * GET /api/admin/specialties/{id}
     * Chi tiết 1 chuyên khoa.
     */
    public function show(int $id): JsonResponse
    {
        $specialty = $this->specialtyService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết chuyên khoa thành công.',
            'data'    => $specialty,
        ]);
    }

    /**
     * POST /api/admin/specialties
     * Tạo chuyên khoa mới.
     */
    public function store(SpecialtyRequest $request): JsonResponse
    {
        try {
            $specialty = $this->specialtyService->create($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tạo chuyên khoa thành công.',
                'data'    => $specialty,
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
     * PUT /api/admin/specialties/{id}
     * Cập nhật chuyên khoa.
     */
    public function update(SpecialtyRequest $request, int $id): JsonResponse
    {
        try {
            $specialty = $this->specialtyService->update($id, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật chuyên khoa thành công.',
                'data'    => $specialty,
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
     * DELETE /api/admin/specialties/{id}
     * Xóa chuyên khoa.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->specialtyService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa chuyên khoa thành công.',
                'data'    => null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 422);
        }
    }
}
