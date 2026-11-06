<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\NoShowAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class NoShowAdminController extends Controller
{
    public function __construct(
        protected NoShowAdminService $noShowService
    ) {}

    /**
     * GET /api/admin/no-shows/eligible
     * Danh sách lịch khám đủ điều kiện đánh dấu vắng mặt (E12 Step 1).
     */
    public function eligible(): JsonResponse
    {
        $bookings = $this->noShowService->listEligible();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách lịch đủ điều kiện ghi vắng thành công.',
            'data' => $bookings,
        ]);
    }

    /**
     * POST /api/admin/no-shows/bookings/{id}/confirm
     * Admin xác nhận ghi vắng (E12 Step 2 / T11).
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $booking = $this->noShowService->confirmNoShow(
                $id,
                $request->user(),
                $request->input('reason')
            );

            return response()->json([
                'success' => true,
                'message' => "Xác nhận ghi vắng (no_show) thành công cho lịch #{$booking->code}.",
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->code,
                    'status' => $booking->status,
                ],
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
     * POST /api/admin/no-shows/bookings/{id}/complaint
     * Admin xử lý khiếu nại của bệnh nhân (E12 Step 3).
     */
    public function complaint(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'resolution' => ['required', 'string', 'in:accept,reject'],
            'notes' => ['required', 'string', 'max:500'],
        ]);

        try {
            $result = $this->noShowService->handleComplaint(
                $id,
                $request->input('resolution'),
                $request->user(),
                $request->input('notes')
            );

            return response()->json([
                'success' => true,
                'message' => 'Xử lý khiếu nại lịch khám thành công.',
                'data' => $result,
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
