<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AuditEvent;
use App\Enums\BookingEvent;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\AuditLogger;
use App\Services\BookingStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AdminBookingOverrideController extends Controller
{
    /**
     * Admin cancels a booking on behalf of patient under 24 hours (S4-35, E08, T10).
     * Refunds 50% of exam fee, 0% service fee according to PAY_POLICY row 2.
     */
    public function cancel(
        Request $request,
        int $id,
        BookingStateMachine $stateMachine,
        AuditLogger $auditLogger
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'reason_code' => ['nullable', 'string', 'max:30'],
        ]);

        $admin = $request->user();

        return DB::transaction(function () use ($id, $validated, $admin, $stateMachine, $auditLogger) {
            $booking = Booking::query()->findOrFail($id);

            // Execute transition via BookingStateMachine
            $updatedBooking = $stateMachine->apply(
                $booking,
                BookingEvent::T10,
                $admin,
                [
                    'reason' => $validated['reason'],
                    'reason_code' => $validated['reason_code'] ?? 'ADMIN_OVERRIDE_CANCEL',
                ]
            );

            // BookingStateMachine already creates the policy refund atomically.
            $refundAmount = (int) (DB::table('refunds')
                ->where('booking_id', $booking->id)
                ->where('refund_ref', 'booking-'.$booking->id.'-T10')
                ->value('amount') ?? 0);

            $auditLogger->log(
                AuditEvent::AU_11,
                'booking',
                $booking->id,
                $admin,
                [
                    'event' => 'T10',
                    'status' => 'cancelled',
                    'reason' => $validated['reason'],
                    'refund_amount' => $refundAmount,
                ],
                'Admin hủy lịch theo chính sách hoàn tiền'
            );

            return response()->json([
                'message' => 'Admin đã hủy lịch thành công. Tiền hoàn được xác định theo chính sách.',
                'booking' => $updatedBooking,
                'refund_amount' => $refundAmount,
            ]);
        });
    }

    /**
     * Admin manually records check-in (T09, AU-14).
     */
    public function manualCheckIn(
        Request $request,
        int $id,
        BookingStateMachine $stateMachine,
        AuditLogger $auditLogger
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $admin = $request->user();

        $booking = Booking::query()->findOrFail($id);
        $updatedBooking = $stateMachine->apply(
            $booking,
            BookingEvent::T09,
            $admin,
            ['reason' => $validated['reason'] ?? 'Admin ghi nhận check-in thủ công']
        );

        $auditLogger->log(
            AuditEvent::AU_14,
            'booking',
            $booking->id,
            $admin,
            ['event' => 'T09', 'status' => 'checked_in'],
            'Admin ghi nhận check-in thủ công'
        );

        return response()->json([
            'message' => 'Ghi nhận check-in thủ công thành công.',
            'booking' => $updatedBooking,
        ]);
    }

    /**
     * Admin manually records visit completion (T12, AU-15).
     */
    public function manualComplete(
        Request $request,
        int $id,
        BookingStateMachine $stateMachine,
        AuditLogger $auditLogger
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $admin = $request->user();

        $booking = Booking::query()->findOrFail($id);
        $updatedBooking = $stateMachine->apply(
            $booking,
            BookingEvent::T12,
            $admin,
            ['reason' => $validated['reason'] ?? 'Admin ghi nhận hoàn thành khám thủ công']
        );

        $auditLogger->log(
            AuditEvent::AU_15,
            'booking',
            $booking->id,
            $admin,
            ['event' => 'T12', 'status' => 'completed'],
            'Admin ghi nhận hoàn thành khám thủ công'
        );

        return response()->json([
            'message' => 'Ghi nhận hoàn thành khám thành công.',
            'booking' => $updatedBooking,
        ]);
    }

    /**
     * Admin manually confirms no-show (T11, AU-16, E12).
     */
    public function manualNoShow(
        Request $request,
        int $id,
        BookingStateMachine $stateMachine,
        AuditLogger $auditLogger
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $admin = $request->user();

        $booking = Booking::query()->findOrFail($id);
        $updatedBooking = $stateMachine->apply(
            $booking,
            BookingEvent::T11,
            $admin,
            ['reason' => $validated['reason'] ?? 'Admin xác nhận bệnh nhân không đến khám (No-Show)']
        );

        $auditLogger->log(
            AuditEvent::AU_16,
            'booking',
            $booking->id,
            $admin,
            ['event' => 'T11', 'status' => 'no_show'],
            'Admin xác nhận bệnh nhân vắng mặt (No-Show)'
        );

        return response()->json([
            'message' => 'Xác nhận vắng mặt (No-Show) thành công.',
            'booking' => $updatedBooking,
        ]);
    }
}

