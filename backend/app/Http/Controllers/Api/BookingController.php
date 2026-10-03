<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * Lấy danh sách lịch khám của user đang đăng nhập.
     *
     * GET /api/bookings
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $filters = $request->only(['q', 'keyword', 'status', 'per_page']);

        $bookings = $this->bookingService->getUserBookings($userId, $filters);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách lịch khám thành công',
            'data' => $bookings->items(),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }
}
