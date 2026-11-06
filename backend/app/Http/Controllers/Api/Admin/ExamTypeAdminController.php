<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExamTypeRequest;
use App\Services\Admin\ExamTypeAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class ExamTypeAdminController extends Controller
{
    public function __construct(
        protected ExamTypeAdminService $examTypeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $hospitalId = $request->query('hospital_id') ? (int) $request->query('hospital_id') : null;
        $examTypes = $this->examTypeService->list($hospitalId);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách loại khám thành công.',
            'data' => $examTypes,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $examType = $this->examTypeService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết loại khám thành công.',
            'data' => $examType,
        ]);
    }

    public function store(ExamTypeRequest $request): JsonResponse
    {
        try {
            $examType = $this->examTypeService->create($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tạo loại khám thành công.',
                'data' => $examType,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    public function update(ExamTypeRequest $request, int $id): JsonResponse
    {
        try {
            $examType = $this->examTypeService->update($id, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật loại khám thành công.',
                'data' => $examType,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->examTypeService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa loại khám thành công.',
                'data' => null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 422);
        }
    }
}
