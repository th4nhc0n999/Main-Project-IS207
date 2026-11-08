<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Admin\AdminDemoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdminDemoController extends Controller
{
    public function __construct(
        protected AdminDemoService $demoService
    ) {}

    /**
     * POST /api/admin/demo/bookings/{id}/simulate-payment
     * Admin giả lập thanh toán thành công (source = demo_admin).
     */
    public function simulatePayment(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        try {
            $updatedBooking = $this->demoService->simulatePaymentSuccess(
                $booking,
                $request->user(),
                $request->only(['notes'])
            );

            return response()->json([
                'success' => true,
                'message' => 'Giả lập thanh toán thành công trong chế độ demo (source=demo_admin, AU-17).',
                'data' => [
                    'booking_id' => $updatedBooking->id,
                    'booking_code' => $updatedBooking->code,
                    'status' => $updatedBooking->status,
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
     * POST /api/admin/demo/bookings/{id}/override-decision
     * Admin duyệt hoặc từ chối thay bác sĩ (T05/T06).
     */
    public function overrideDecision(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'decision' => ['required', 'string', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = Booking::findOrFail($id);

        try {
            $updatedBooking = $this->demoService->overrideDoctorDecision(
                $booking,
                $request->input('decision'),
                $request->user(),
                $request->input('reason')
            );

            return response()->json([
                'success' => true,
                'message' => "Admin đã {$request->input('decision')} lịch khám thay bác sĩ thành công (AU-17).",
                'data' => [
                    'booking_id' => $updatedBooking->id,
                    'booking_code' => $updatedBooking->code,
                    'status' => $updatedBooking->status,
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
}

