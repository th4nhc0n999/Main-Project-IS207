<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SlotRequest;
use App\Services\Admin\SlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SlotController extends Controller
{
    public function __construct(
        protected SlotService $slotService
    ) {}

    /**
     * GET /api/admin/slots
     * Danh sách khung giờ khám, hỗ trợ nhiều bộ lọc.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'owner_type', 'owner_id', 'work_date',
            'from_date', 'to_date', 'status',
        ]);

        $slots = $this->slotService->list($filters);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách khung giờ thành công.',
            'data'    => $slots,
        ]);
    }

    /**
     * GET /api/admin/slots/{id}
     * Chi tiết 1 khung giờ khám.
     */
    public function show(int $id): JsonResponse
    {
        $slot = $this->slotService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết khung giờ thành công.',
            'data'    => $slot,
        ]);
    }

    /**
     * POST /api/admin/slots
     * Tạo 1 khung giờ khám.
     */
    public function store(SlotRequest $request): JsonResponse
    {
        try {
            $slot = $this->slotService->create($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tạo khung giờ thành công.',
                'data'    => $slot,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 422);
        }
    }

    /**
     * POST /api/admin/slots/batch
     * Tạo hàng loạt khung giờ khám trong 1 ngày.
     */
    public function storeBatch(Request $request): JsonResponse
    {
        try {
            $slots = $this->slotService->createBatch($request->all());

            return response()->json([
                'success' => true,
                'message' => "Tạo thành công {$slots->count()} khung giờ.",
                'data'    => $slots,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 422);
        }
    }

    /**
     * PUT /api/admin/slots/{id}
     * Cập nhật khung giờ khám.
     */
    public function update(SlotRequest $request, int $id): JsonResponse
    {
        try {
            $slot = $this->slotService->update($id, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật khung giờ thành công.',
                'data'    => $slot,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 422);
        }
    }

    /**
     * DELETE /api/admin/slots/{id}
     * Xóa khung giờ khám.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->slotService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa khung giờ thành công.',
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

    /**
     * PATCH /api/admin/slots/{id}/toggle-block
     * Chặn hoặc mở khóa khung giờ khám.
     */
    public function toggleBlock(int $id): JsonResponse
    {
        try {
            $slot = $this->slotService->toggleBlock($id);

            $action = $slot->status === 'blocked' ? 'Khóa' : 'Mở khóa';

            return response()->json([
                'success' => true,
                'message' => "{$action} khung giờ thành công.",
                'data'    => $slot,
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
