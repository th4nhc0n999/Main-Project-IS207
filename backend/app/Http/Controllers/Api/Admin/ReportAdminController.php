<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ReportAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportAdminController extends Controller
{
    public function __construct(
        protected ReportAdminService $reportService
    ) {}

    /**
     * GET /api/admin/reports/booking-status
     * Báo cáo 1: Phân bổ 9 trạng thái lịch hẹn.
     */
    public function bookingStatus(Request $request): JsonResponse
    {
        $data = $this->reportService->getBookingStatusReport(
            $request->query('from_date'),
            $request->query('to_date')
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo phân bổ 9 trạng thái lịch thành công.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/admin/reports/net-revenue
     * Báo cáo 2: Doanh thu ròng (Tổng thu - Tổng hoàn).
     */
    public function netRevenue(Request $request): JsonResponse
    {
        $data = $this->reportService->getNetRevenueReport(
            $request->query('from_date'),
            $request->query('to_date')
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo doanh thu ròng thành công (DL-25/CF-53).',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/admin/reports/cancellation-rate
     * Báo cáo 3: Tỷ lệ hủy theo nguyên nhân.
     */
    public function cancellationRate(Request $request): JsonResponse
    {
        $data = $this->reportService->getCancellationRateReport(
            $request->query('from_date'),
            $request->query('to_date')
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo tỷ lệ hủy theo nguyên nhân thành công.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/admin/reports/top-booked
     * Báo cáo 4: Xếp hạng bác sĩ và chuyên khoa được đặt nhiều nhất.
     */
    public function topBooked(Request $request): JsonResponse
    {
        $limit = $request->query('limit') ? (int) $request->query('limit') : 5;
        $data = $this->reportService->getTopBookedReport($limit);

        return response()->json([
            'success' => true,
            'message' => 'Lấy báo cáo top bác sĩ và chuyên khoa được đặt nhiều nhất thành công.',
            'data' => $data,
        ]);
    }
}

