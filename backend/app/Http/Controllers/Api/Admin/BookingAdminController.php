<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\BookingAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BookingAdminController extends Controller
{
    public function __construct(
        protected BookingAdminService $bookingService
    ) {}

    /**
     * GET /api/admin/bookings
     * Danh sách toàn bộ lịch hẹn, hỗ trợ lọc theo nhiều tiêu chí.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 'booking_type', 'doctor_id',
            'hospital_id', 'from_date', 'to_date',
        ]);

        $bookings = $this->bookingService->list($filters);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách lịch hẹn thành công.',
            'data'    => $bookings,
        ]);
    }

    /**
     * GET /api/admin/bookings/{id}
     * Chi tiết 1 lịch hẹn.
     */
    public function show(int $id): JsonResponse
    {
        $booking = $this->bookingService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết lịch hẹn thành công.',
            'data'    => $booking,
        ]);
    }

    /**
     * PATCH /api/admin/bookings/{id}/status
     * Cập nhật trạng thái lịch hẹn (duyệt / từ chối / hoàn thành).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:confirmed,rejected,cancelled,completed',
            'note'   => 'nullable|string|max:255',
        ]);

        try {
            $booking = $this->bookingService->updateStatus(
                $id,
                $request->input('status'),
                $request->input('note')
            );

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái lịch hẹn thành công.',
                'data'    => $booking,
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
     * GET /api/admin/dashboard
     * Thống kê tổng quan cho Admin Dashboard.
     */
    public function dashboard(): JsonResponse
    {
        $stats = $this->bookingService->getDashboardStats();

        return response()->json([
            'success' => true,
            'message' => 'Lấy thống kê dashboard thành công.',
            'data'    => $stats,
        ]);
    }
}
