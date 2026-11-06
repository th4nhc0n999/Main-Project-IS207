<?php

namespace App\Jobs;

use App\Enums\AuditEvent;
use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Services\AuditLogger;
use App\Services\BookingStateMachine;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ProcessBookingExpiriesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
    }

    public function handle(BookingStateMachine $stateMachine, AuditLogger $auditLogger): array
    {
        $expiredHoldsCount = $this->processExpiredHolds($stateMachine, $auditLogger);
        $expiredApprovalsCount = $this->processExpiredApprovals($stateMachine, $auditLogger);
        $noShowEligibleCount = $this->processNoShowEligibility($auditLogger);

        return [
            'expired_holds' => $expiredHoldsCount,
            'expired_approvals' => $expiredApprovalsCount,
            'no_show_eligible' => $noShowEligibleCount,
        ];
    }

    /**
     * T03: Process hold expirations for bookings in pending_payment.
     * Takes into account a 5-minute grace period if there is a pending payment transaction.
     */
    public function processExpiredHolds(BookingStateMachine $stateMachine, AuditLogger $auditLogger): int
    {
        $count = 0;
        $now = now();
        $graceMinutes = (int) config('medsi.grace_minutes', 5);

        // Fetch candidate bookings
        $candidates = Booking::query()
            ->where('status', BookingStatus::PENDING_PAYMENT->value)
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<=', $now)
            ->get();

        foreach ($candidates as $candidate) {
            try {
                // Check if payment has pending transaction that gives 5 minutes grace
                $payment = DB::table('payments')->where('booking_id', $candidate->id)->first();
                if ($payment) {
                    $hasPendingTxn = DB::table('payment_transactions')
                        ->where('payment_id', $payment->id)
                        ->where('status', 'pending')
                        ->exists();

                    if ($hasPendingTxn) {
                        $graceDeadline = CarbonImmutable::parse($candidate->hold_expires_at)->addMinutes($graceMinutes);
                        if ($now->lt($graceDeadline)) {
                            // Still within grace period, skip expiring now
                            continue;
                        }
                    }
                }

                // Apply T03 transition
                $stateMachine->apply(
                    $candidate,
                    BookingEvent::T03,
                    'system',
                    ['reason' => 'Hết hạn giữ chỗ 15 phút']
                );

                $auditLogger->log(
                    AuditEvent::AU_13,
                    'booking',
                    (int) $candidate->id,
                    'system',
                    ['event' => 'T03', 'from' => 'pending_payment', 'to' => 'expired'],
                    'Hết hạn giữ chỗ 15 phút'
                );

                $count++;
            } catch (Throwable $e) {
                // Log and continue to keep job idempotent and resilient
                Log::warning("Failed to expire booking hold {$candidate->id}: {$e->getMessage()}");
            }
        }

        return $count;
    }

    /**
     * T07: Process approval expirations for doctor bookings in pending_approval.
     * Decrements slot count, expires booking, and creates full refund request (PAY_POLICY row 6).
     */
    public function processExpiredApprovals(BookingStateMachine $stateMachine, AuditLogger $auditLogger): int
    {
        $count = 0;
        $now = now();

        $candidates = Booking::query()
            ->where('status', BookingStatus::PENDING_APPROVAL->value)
            ->whereNotNull('approval_expires_at')
            ->where('approval_expires_at', '<=', $now)
            ->get();

        foreach ($candidates as $candidate) {
            try {
                // Apply T07 transition
                $stateMachine->apply(
                    $candidate,
                    BookingEvent::T07,
                    'system',
                    ['reason' => 'Bác sĩ không duyệt lịch trong vòng 30 phút']
                );

                $auditLogger->log(
                    AuditEvent::AU_13,
                    'booking',
                    (int) $candidate->id,
                    'system',
                    ['event' => 'T07', 'from' => 'pending_approval', 'to' => 'expired'],
                    'Hết hạn duyệt 30 phút'
                );

                // Auto-create refund request if not already created (PAY_POLICY row 6)
                $payment = DB::table('payments')->where('booking_id', $candidate->id)->first();
                if ($payment && ! DB::table('refunds')->where('booking_id', $candidate->id)->exists()) {
                    $refundAmount = (int) $payment->received_amount;
                    $examFeeRefunded = (int) ($payment->exam_fee - $payment->discount_amount);
                    $serviceFeeRefunded = (int) $payment->service_fee;

                    // Ensure sum constraint
                    if ($examFeeRefunded + $serviceFeeRefunded !== $refundAmount) {
                        $examFeeRefunded = $refundAmount - $serviceFeeRefunded;
                    }

                    $refundId = DB::table('refunds')->insertGetId([
                        'payment_id' => $payment->id,
                        'booking_id' => $candidate->id,
                        'amount' => $refundAmount,
                        'exam_fee_refunded' => $examFeeRefunded,
                        'service_fee_refunded' => $serviceFeeRefunded,
                        'policy_case' => 'T07_expired',
                        'reason' => 'Bác sĩ không duyệt lịch trong 30 phút (T07)',
                        'status' => 'requested',
                        'refund_ref' => 'RF'.now()->format('ymd').Str::upper(Str::random(8)),
                        'requested_by' => null,
                        'approved_by' => null,
                        'requested_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $auditLogger->log(
                        AuditEvent::AU_18,
                        'refund',
                        $refundId,
                        'system',
                        [
                            'booking_id' => $candidate->id,
                            'amount' => $refundAmount,
                            'policy_case' => 'T07_expired',
                            'status' => 'requested',
                        ],
                        'Tự động tạo yêu cầu hoàn tiền do hết hạn duyệt'
                    );
                }

                $count++;
            } catch (Throwable $e) {
                Log::warning("Failed to expire booking approval {$candidate->id}: {$e->getMessage()}");
            }
        }

        return $count;
    }

    /**
     * Mark bookings eligible for No-Show confirmation (DL-08).
     * Doctor bookings: slot.work_date + slot.start_time + 15 minutes.
     * Hospital bookings: slot.work_date + slot.end_time + 120 minutes.
     */
    public function processNoShowEligibility(AuditLogger $auditLogger): int
    {
        $count = 0;
        $now = now();

        $doctorAfterStart = (int) config('medsi.no_show_doctor_after_start_minutes', 15);
        $hospitalAfterEnd = (int) config('medsi.no_show_hospital_after_end_minutes', 120);

        // Candidate confirmed bookings with issued tickets
        $candidates = Booking::query()
            ->join('slots', 'slots.id', '=', 'bookings.slot_id')
            ->join('tickets', 'tickets.booking_id', '=', 'bookings.id')
            ->where('bookings.status', BookingStatus::CONFIRMED->value)
            ->where('tickets.status', 'issued')
            ->select('bookings.*', 'slots.work_date', 'slots.start_time', 'slots.end_time')
            ->get();

        foreach ($candidates as $candidate) {
            $threshold = $candidate->booking_type === 'doctor'
                ? CarbonImmutable::parse($candidate->work_date.' '.$candidate->start_time)->addMinutes($doctorAfterStart)
                : CarbonImmutable::parse($candidate->work_date.' '.$candidate->end_time)->addMinutes($hospitalAfterEnd);

            if ($now->gte($threshold)) {
                // Ensure idempotent logging so we don't spam audit logs
                $alreadyLogged = DB::table('audit_logs')
                    ->where('action', 'NO_SHOW_ELIGIBLE')
                    ->where('entity_type', 'booking')
                    ->where('entity_id', $candidate->id)
                    ->exists();

                if (! $alreadyLogged) {
                    $auditLogger->log(
                        'NO_SHOW_ELIGIBLE',
                        'booking',
                        (int) $candidate->id,
                        'system',
                        [
                            'booking_id' => $candidate->id,
                            'booking_type' => $candidate->booking_type,
                            'threshold' => $threshold->toIso8601String(),
                            'eligible_at' => $now->toIso8601String(),
                        ],
                        'Lịch đủ điều kiện xác nhận vắng mặt (No-Show)'
                    );
                }

                $count++;
            }
        }

        return $count;
    }
}

