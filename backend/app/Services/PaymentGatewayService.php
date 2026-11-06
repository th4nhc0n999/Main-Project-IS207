<?php

namespace App\Services;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentGatewayService
{
    public function __construct(private BookingStateMachine $machine) {}

    public function start(int $bookingId, string $method, User $user): object
    {
        return DB::transaction(function () use ($bookingId, $method, $user) {
            [$booking, $payment] = $this->lock($bookingId);
            $this->authorize($booking, $user);
            if (! in_array($method, ['atm', 'credit_card', 'qr_pay', 'momo', 'store_pay'], true)) {
                $this->invalid('Phương thức thanh toán không hợp lệ.');
            }
            if ($booking->status->value !== 'pending_payment' || (int) $payment->received_amount > 0
                || ! $booking->hold_expires_at || now()->gte($booking->hold_expires_at)) {
                $this->invalid('Lịch không còn được phép bắt đầu thanh toán.');
            }
            $pending = DB::table('payment_transactions')->where('payment_id', $payment->id)
                ->where('status', 'pending')->first();
            if ($pending) {
                if ($payment->method !== $method) {
                    $this->invalid('Cần truy vấn giao dịch đang chờ trước khi đổi phương thức.');
                }

                return $pending;
            }
            if ($method === 'store_pay') {
                if ($booking->booking_type !== 'hospital') {
                    $this->invalid('Chỉ lịch bệnh viện được thanh toán tại quầy.');
                }
                $slot = DB::table('slots')->find($booking->slot_id);
                $deadline = CarbonImmutable::parse($slot->work_date.' '.$slot->start_time)
                    ->subMinutes((int) config('medsi.store_pay_cutoff_minutes_before'));
                if (now()->gte($deadline)) {
                    $this->invalid('Đã quá hạn thanh toán tại quầy.');
                }
                $booking->hold_expires_at = $deadline;
                $booking->save();
            } elseif ($payment->method === 'store_pay') {
                $this->invalid('Không đổi giao dịch tại quầy sang trực tuyến.');
            }
            DB::table('payments')->where('id', $payment->id)->update([
                'method' => $method, 'status' => 'pending', 'updated_at' => now(),
            ]);
            $id = DB::table('payment_transactions')->insertGetId([
                'payment_id' => $payment->id, 'transaction_code' => 'SIM-'.Str::uuid(),
                'amount' => $payment->total_amount, 'status' => 'pending',
                'source' => $method === 'store_pay' ? 'counter' : 'gateway',
                'received_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);

            return DB::table('payment_transactions')->find($id);
        });
    }

    /** Only a verified simulated gateway or authorized Admin may call this method. */
    public function callback(int $bookingId, string $code, int $amount, string $status, string $source = 'gateway'): object
    {
        return DB::transaction(function () use ($bookingId, $code, $amount, $status, $source) {
            [$booking, $payment] = $this->lock($bookingId);
            if (! in_array($status, ['success', 'failed'], true) || $amount !== (int) $payment->total_amount
                || ! in_array($source, ['gateway', 'counter', 'demo_admin'], true)) {
                $this->invalid('Kết quả hoặc số tiền không khớp giao dịch.');
            }
            if (($payment->method === 'store_pay') !== ($source === 'counter')) {
                $this->invalid('Nguồn xác nhận không khớp phương thức thanh toán.');
            }
            $transaction = DB::table('payment_transactions')->where('transaction_code', $code)->lockForUpdate()->first();
            if ($transaction && ((int) $transaction->payment_id !== (int) $payment->id
                || (int) $transaction->amount !== $amount || $transaction->source !== $source)) {
                $this->invalid('Mã giao dịch đã thuộc một khoản thanh toán khác.');
            }
            if ($transaction && $transaction->status !== 'pending') {
                // Terminal callback is immutable, even if a later message disagrees.
                $this->machine->apply($booking, BookingEvent::T15, 'gateway', ['transaction_code' => $code]);

                return $transaction;
            }
            $deadline = $booking->hold_expires_at?->copy();
            if ($deadline && $source !== 'counter' && $transaction
                && CarbonImmutable::parse($transaction->created_at)->lt($deadline)) {
                $deadline->addMinutes((int) config('medsi.grace_minutes'));
            }
            $withinHold = $deadline && now()->lt($deadline);
            $values = ['status' => $status, 'received_at' => now(), 'updated_at' => now()];
            if ($transaction) {
                DB::table('payment_transactions')->where('id', $transaction->id)->update($values);
                $id = $transaction->id;
            } else {
                $id = DB::table('payment_transactions')->insertGetId($values + [
                    'payment_id' => $payment->id, 'transaction_code' => $code, 'amount' => $amount,
                    'source' => $source, 'created_at' => now(),
                ]);
            }
            DB::table('audit_logs')->insert([
                'actor_id' => null, 'actor_type' => $source === 'counter' ? 'system' : 'gateway',
                'action' => 'payment_transaction.'.$status, 'entity_type' => 'payment_transaction',
                'entity_id' => $id, 'occurred_at' => now(),
                'changes' => json_encode(['from' => $transaction?->status, 'to' => $status,
                    'transaction_code' => $code, 'amount' => $amount]),
            ]);
            if ($status === 'failed') {
                if ($booking->status->value === 'pending_payment' && (int) $payment->received_amount === 0) {
                    DB::table('payments')->where('id', $payment->id)->update(['status' => 'failed', 'updated_at' => now()]);
                    $this->machine->apply($booking, BookingEvent::T14, 'gateway', ['transaction_code' => $code]);
                }

                return DB::table('payment_transactions')->find($id);
            }
            $duplicate = (int) $payment->received_amount > 0;
            if ((int) $payment->received_amount > 999999999999 - $amount) {
                $this->invalid('Tổng tiền vượt giới hạn lưu trữ, cần đối soát.');
            }
            DB::table('payments')->where('id', $payment->id)->update([
                'received_amount' => (int) $payment->received_amount + $amount,
                'status' => 'paid', 'paid_at' => $payment->paid_at ?? now(), 'updated_at' => now(),
            ]);
            if (! $duplicate && $booking->status->value === 'pending_payment' && $withinHold) {
                $this->machine->apply($booking,
                    $booking->booking_type === 'doctor' ? BookingEvent::T02 : BookingEvent::T02H,
                    'gateway', ['transaction_code' => $code]);
            } else {
                if ($booking->status->value === 'pending_payment') {
                    $this->machine->apply($booking, BookingEvent::T03, 'system');
                    $booking->refresh();
                }
                $this->machine->apply($booking, BookingEvent::T16, 'gateway', ['transaction_code' => $code]);
            }

            return DB::table('payment_transactions')->find($id);
        });
    }

    public function confirmCounter(int $bookingId, User $admin): object
    {
        abort_unless($admin->role === 'admin' && $admin->status->value === 'active', 403);

        return DB::transaction(function () use ($bookingId, $admin) {
            [$booking, $payment] = $this->lock($bookingId);
            if ($payment->method !== 'store_pay' || $booking->booking_type !== 'hospital'
                || ! $booking->hold_expires_at || now()->gte($booking->hold_expires_at)) {
                $this->invalid('Không thể xác nhận trả tại quầy sau hạn hoặc sai loại lịch.');
            }
            $transaction = DB::table('payment_transactions')->where('payment_id', $payment->id)
                ->where('source', 'counter')->orderByDesc('id')->first();
            if (! $transaction) {
                $this->invalid('Chưa đăng ký thanh toán tại quầy.');
            }

            $result = $this->callback($bookingId, $transaction->transaction_code,
                (int) $transaction->amount, 'success', 'counter');
            if ($transaction->status === 'pending') {
                DB::table('audit_logs')->insert(['actor_id' => $admin->id, 'actor_type' => 'user',
                    'action' => 'payment.counter_confirmed', 'entity_type' => 'payment',
                    'entity_id' => $payment->id, 'occurred_at' => now(),
                    'changes' => json_encode(['transaction_code' => $transaction->transaction_code])]);
            }

            return $result;
        });
    }

    private function lock(int $bookingId): array
    {
        $reference = Booking::query()->findOrFail($bookingId);
        // Same lock order as BookingStateMachine to avoid cross-module deadlocks.
        Slot::query()->whereKey($reference->slot_id)->lockForUpdate()->firstOrFail();
        $booking = Booking::query()->whereKey($bookingId)->lockForUpdate()->firstOrFail();
        $payment = DB::table('payments')->where('booking_id', $bookingId)->lockForUpdate()->first();
        abort_unless($payment, 404);

        return [$booking, $payment];
    }

    private function authorize(Booking $booking, User $user): void
    {
        abort_unless($user->status->value === 'active' && ($user->role === 'admin'
            || ($user->role === 'patient' && (int) $booking->user_id === (int) $user->id)), 403);
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['payment' => $message]);
    }
}
