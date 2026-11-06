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
use Illuminate\Support\Str;
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
            $booking = Booking::query()->lockForUpdate()->findOrFail($id);

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

            // Calculate refund according to PAY_POLICY row 2: 50% exam fee, 0% service fee
            $payment = DB::table('payments')->where('booking_id', $booking->id)->first();
            $refundAmount = 0;

            if ($payment && $payment->received_amount > 0) {
                $examFee = (int) ($payment->exam_fee - $payment->discount_amount);
                $examFeeRefunded = (int) round($examFee * 0.5); // 50%
                $serviceFeeRefunded = 0;
                $refundAmount = $examFeeRefunded + $serviceFeeRefunded;

                $refundId = DB::table('refunds')->insertGetId([
                    'payment_id' => $payment->id,
                    'booking_id' => $booking->id,
                    'amount' => $refundAmount,
                    'exam_fee_refunded' => $examFeeRefunded,
                    'service_fee_refunded' => $serviceFeeRefunded,
                    'policy_case' => 'patient_cancel_under_24h_admin',
                    'reason' => $validated['reason'],
                    'status' => 'requested',
                    'refund_ref' => 'RF'.now()->format('ymd').Str::upper(Str::random(8)),
                    'requested_by' => $admin->id,
                    'approved_by' => null,
                    'requested_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $auditLogger->log(
                    AuditEvent::AU_18,
                    'refund',
                    $refundId,
                    $admin,
                    [
                        'booking_id' => $booking->id,
                        'amount' => $refundAmount,
                        'exam_fee_refunded' => $examFeeRefunded,
                        'service_fee_refunded' => 0,
                        'policy_case' => 'patient_cancel_under_24h_admin',
                    ],
                    'Admin huỷ hộ lịch dưới 24h, tạo yêu cầu hoàn 50% phí khám'
                );
            }

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
                'Admin huỷ hộ lịch dưới 24 giờ'
            );

            return response()->json([
                'message' => 'Admin đã huỷ lịch thành công và tạo yêu cầu hoàn 50% phí khám.',
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

