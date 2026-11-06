<?php

namespace App\Services;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundService
{
    public function forBookingEvent(Booking $booking, BookingEvent $event, User|string $actor, array $context): void
    {
        if (! in_array($event, [BookingEvent::T06, BookingEvent::T07, BookingEvent::T08,
            BookingEvent::T10, BookingEvent::T13, BookingEvent::T16], true)) {
            return;
        }
        $payment = DB::table('payments')->where('booking_id', $booking->id)->lockForUpdate()->first();
        if (! $payment || (int) $payment->received_amount === 0) {
            return;
        }
        if ($event === BookingEvent::T16) {
            $transaction = DB::table('payment_transactions')->where('payment_id', $payment->id)
                ->where('transaction_code', $context['transaction_code'] ?? '')
                ->where('status', 'success')->first();
            if (! $transaction || (int) $transaction->amount !== (int) $payment->total_amount) {
                throw ValidationException::withMessages(['transaction_code' => 'T16 cần khoản thu thành công đã được xác minh.']);
            }
            $duplicate = DB::table('payment_transactions')->where('payment_id', $payment->id)
                ->where('status', 'success')->where('id', '<>', $transaction->id)->exists();
            $this->request($payment, (int) $payment->exam_fee - (int) $payment->discount_amount,
                (int) $payment->service_fee, $duplicate ? 'duplicate_payment' : 'late_payment',
                'transaction-'.$transaction->id, $duplicate ? 'Hoàn khoản thu thứ hai.' : 'Hoàn tiền nhận sau hạn hoặc khi lịch đã đóng.');

            return;
        }
        $policy = match ($event) {
            BookingEvent::T06 => 'doctor_rejected',
            BookingEvent::T07 => 'approval_expired',
            BookingEvent::T13 => 'hospital_closed',
            default => $this->cancellationPolicy($booking, $actor, $context),
        };
        $exam = (int) $payment->exam_fee - (int) $payment->discount_amount;
        $service = (int) $payment->service_fee;
        if (in_array($policy, ['early_cancellation', 'late_cancellation'], true)) {
            $service = 0;
            if ($policy === 'late_cancellation') {
                // Integer half-up rounding; no floating-point currency arithmetic.
                $exam = intdiv($exam * (int) config('medsi.late_cancel_refund_percent') + 50, 100);
            }
        }
        $this->request($payment, $exam, $service, $policy,
            'booking-'.$booking->id.'-'.$event->value,
            $context['reason'] ?? 'Hoàn tiền theo '.$event->value);
    }

    private function cancellationPolicy(Booking $booking, User|string $actor, array $context): string
    {
        if ($actor instanceof User && $actor->role === 'doctor') {
            return 'doctor_unavailable';
        }
        $reason = $context['reason_code'] ?? null;
        if ($actor instanceof User && $actor->role === 'admin'
            && in_array($reason, ['doctor_unavailable', 'hospital_closed', 'provider_reschedule'], true)) {
            return $reason;
        }
        $slot = DB::table('slots')->find($booking->slot_id);
        $start = CarbonImmutable::parse($slot->work_date.' '.$slot->start_time);

        return now()->lte($start->subHours((int) config('medsi.free_cancel_hours')))
            ? 'early_cancellation' : 'late_cancellation';
    }

    /** Caller holds the payment lock; stable ref identifies the business event. */
    public function request(object $payment, int $exam, int $service, string $policy, string $ref, string $reason): ?object
    {
        return DB::transaction(function () use ($payment, $exam, $service, $policy, $ref, $reason) {
            $payment = DB::table('payments')->where('id', $payment->id)->lockForUpdate()->first();
            $existing = DB::table('refunds')->where('refund_ref', $ref)->first();
            if ($existing) {
                if ((int) $existing->payment_id !== (int) $payment->id) {
                    throw ValidationException::withMessages(['refund_ref' => 'Mã hoàn đã thuộc giao dịch khác.']);
                }

                return $existing;
            }
            $amount = $exam + $service;
            if ($amount === 0) {
                return null;
            }
            if ($exam < 0 || $service < 0) {
                throw ValidationException::withMessages(['amount' => 'Tiền hoàn không được âm.']);
            }
            $this->assertAvailable($payment, $amount);
            $id = DB::table('refunds')->insertGetId([
                'payment_id' => $payment->id, 'booking_id' => $payment->booking_id,
                'amount' => $amount, 'exam_fee_refunded' => $exam, 'service_fee_refunded' => $service,
                'policy_case' => $policy, 'reason' => mb_substr($reason, 0, 255),
                'status' => 'requested', 'refund_ref' => $ref, 'requested_by' => null,
                'requested_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('audit_logs')->insert([
                'actor_id' => null, 'actor_type' => 'system', 'action' => 'refund.requested',
                'entity_type' => 'refund', 'entity_id' => $id, 'occurred_at' => now(),
                'reason' => mb_substr($reason, 0, 255),
                'changes' => json_encode(['policy_case' => $policy, 'amount' => $amount, 'refund_ref' => $ref]),
            ]);

            return DB::table('refunds')->find($id);
        });
    }

    public function transition(int $id, string $next, User $admin): object
    {
        abort_unless($admin->role === 'admin' && $admin->status->value === 'active', 403);

        return DB::transaction(function () use ($id, $next, $admin) {
            $reference = DB::table('refunds')->find($id);
            abort_unless($reference, 404);
            $payment = DB::table('payments')->where('id', $reference->payment_id)->lockForUpdate()->first();
            $refund = DB::table('refunds')->where('id', $id)->lockForUpdate()->first();
            if ($refund->status === $next) {
                return $refund;
            }
            $allowed = ['requested' => ['approved', 'rejected'], 'approved' => ['processing'],
                'processing' => ['succeeded', 'failed'], 'failed' => ['approved']];
            if (! in_array($next, $allowed[$refund->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Không được chuyển trạng thái hoàn tiền này.']);
            }
            if (in_array($next, ['approved', 'processing', 'succeeded'], true)) {
                $this->assertAvailable($payment, (int) $refund->amount, $id);
            }
            $changes = ['status' => $next, 'updated_at' => now()];
            if ($next === 'approved') {
                $changes['approved_by'] = $admin->id;
            }
            if ($next === 'succeeded') {
                $changes['processed_at'] = now();
                $total = (int) $payment->refunded_amount + (int) $refund->amount;
                DB::table('payments')->where('id', $payment->id)->update([
                    'refunded_amount' => $total,
                    'status' => $total === (int) $payment->received_amount ? 'refunded' : 'paid',
                    'updated_at' => now(),
                ]);
            }
            DB::table('refunds')->where('id', $id)->update($changes);
            DB::table('audit_logs')->insert([
                'actor_id' => $admin->id, 'actor_type' => 'user', 'action' => 'refund.'.$next,
                'entity_type' => 'refund', 'entity_id' => $id, 'occurred_at' => now(),
                'changes' => json_encode(['from' => $refund->status, 'to' => $next]),
            ]);

            return DB::table('refunds')->find($id);
        });
    }

    private function assertAvailable(object $payment, int $amount, ?int $exclude = null): void
    {
        $reserved = (int) DB::table('refunds')->where('payment_id', $payment->id)
            ->whereIn('status', ['requested', 'approved', 'processing'])
            ->when($exclude !== null, fn ($query) => $query->where('id', '<>', $exclude))->sum('amount');
        if ($amount > (int) $payment->received_amount - (int) $payment->refunded_amount - $reserved) {
            throw ValidationException::withMessages(['amount' => 'Số tiền còn có thể hoàn không đủ.']);
        }
    }
}
