<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\RefundAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class RefundAdminController extends Controller
{
    public function __construct(
        protected RefundAdminService $refundService
    ) {}

    /**
     * GET /api/admin/refunds
     * Danh sách yêu cầu hoàn tiền (lọc theo status).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $refunds = $this->refundService->list($status);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách yêu cầu hoàn tiền thành công.',
            'data' => $refunds,
        ]);
    }

    /**
     * GET /api/admin/refunds/{id}
     * Chi tiết 1 yêu cầu hoàn tiền.
     */
    public function show(int $id): JsonResponse
    {
        $refund = $this->refundService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết hoàn tiền thành công.',
            'data' => $refund,
        ]);
    }

    /**
     * POST /api/admin/refunds/{id}/decide
     * Duyệt (approve) hoặc từ chối (reject) hoàn tiền.
     */
    public function decide(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'decision' => ['required', 'string', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $refund = $this->refundService->decide(
                $id,
                $request->input('decision'),
                $request->user(),
                $request->input('reason')
            );

            return response()->json([
                'success' => true,
                'message' => "Đã {$request->input('decision')} yêu cầu hoàn tiền #{$refund->refund_ref} thành công.",
                'data' => $refund,
            ]);
        } catch (Throwable $e) {
            $status = $e instanceof \InvalidArgumentException ? 422 : 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $status);
        }
    }

    /**
     * POST /api/admin/refunds/{id}/process-simulation
     * Giải ngân hoàn tiền mô phỏng (succeeded).
     */
    public function processSimulation(Request $request, int $id): JsonResponse
    {
        try {
            $refund = $this->refundService->processSimulatedSuccess(
                $id,
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => "Hoàn tất giải ngân hoàn tiền mô phỏng (succeeded) cho mã #{$refund->refund_ref}.",
                'data' => $refund,
            ]);
        } catch (Throwable $e) {
            $status = $e instanceof \InvalidArgumentException ? 422 : 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $status);
        }
    }
}

