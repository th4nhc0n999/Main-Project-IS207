<?php

namespace App\Services\Admin;

use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\BookingStateMachine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class AdminDemoService
{
    public function __construct(
        protected BookingStateMachine $stateMachine
    ) {}

    /**
     * Giả lập thanh toán thành công (demo_admin).
     * Tạo transaction với source = 'demo_admin', đưa booking sang pending_approval (doctor) hoặc confirmed (hospital).
     * Ghi log AU-17 vào audit_logs.
     */
    public function simulatePaymentSuccess(Booking $booking, User $admin, array $metadata = []): Booking
    {
        $statusValue = $booking->status instanceof BookingStatus ? $booking->status->value : (string) $booking->status;

        if ($statusValue !== 'pending_payment') {
            throw new InvalidArgumentException("Chỉ có thể giả lập thanh toán khi lịch ở trạng thái pending_payment (hiện tại: {$statusValue}).");
        }

        return DB::transaction(function () use ($booking, $admin, $metadata) {
            // 1. Tìm hoặc tạo Payment
            $payment = Payment::firstOrCreate(
                ['booking_id' => $booking->id],
                [
                    'method' => 'qr_pay',
                    'exam_fee' => 200000,
                    'discount_amount' => 0,
                    'service_fee' => (int) config('medsi.service_fee_amount', 20000),
                    'total_amount' => 220000,
                    'received_amount' => 0,
                    'refunded_amount' => 0,
                    'status' => 'pending',
                ]
            );

            // 2. Tạo PaymentTransaction với source = 'demo_admin'
            $transactionCode = 'TX-DEMO-' . strtoupper(Str::random(10));
            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'transaction_code' => $transactionCode,
                'amount' => $payment->total_amount,
                'status' => 'success',
                'source' => 'demo_admin',
                'received_at' => now(),
                'raw_payload' => array_merge(['simulator' => 'admin_demo', 'admin_id' => $admin->id], $metadata),
            ]);

            // Cập nhật Payment
            $payment->received_amount = $payment->total_amount;
            $payment->status = 'paid';
            $payment->paid_at = now();
            $payment->save();

            // Đảm bảo thời hạn hold hợp lệ trong chế độ demo
            if (! $booking->hold_expires_at || now()->gt($booking->hold_expires_at)) {
                $booking->hold_expires_at = now()->addMinutes((int) config('medsi.hold_minutes', 15));
                $booking->save();
            }

            // 3. Kích hoạt chuyển trạng thái qua BookingStateMachine (T02 hoặc T02H)
            $event = $booking->booking_type === 'doctor' ? BookingEvent::T02 : BookingEvent::T02H;
            $updatedBooking = $this->stateMachine->apply($booking, $event, $admin, [
                'reason' => 'Admin demo simulated payment success',
                'source' => 'demo_admin',
            ]);

            $newStatusVal = $updatedBooking->status instanceof BookingStatus ? $updatedBooking->status->value : (string) $updatedBooking->status;

            // 4. Ghi Audit Log AU-17 (Demo Mode Action)
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'AU-17',
                'entity_type' => 'booking',
                'entity_id' => $booking->id,
                'reason' => 'Admin simulated payment success in demo mode',
                'changes' => [
                    'event' => $event->value,
                    'transaction_code' => $transactionCode,
                    'source' => 'demo_admin',
                    'new_status' => $newStatusVal,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return $updatedBooking;
        });
    }

    /**
     * Admin duyệt thay bác sĩ trong chế độ demo (T05: Chấp nhận, T06: Từ chối).
     * Ghi log AU-17 vào audit_logs.
     */
    public function overrideDoctorDecision(Booking $booking, string $decision, User $admin, ?string $reason = null): Booking
    {
        $statusValue = $booking->status instanceof BookingStatus ? $booking->status->value : (string) $booking->status;

        if ($statusValue !== 'pending_approval') {
            throw new InvalidArgumentException("Chỉ có thể duyệt thay bác sĩ khi lịch ở trạng thái pending_approval (hiện tại: {$statusValue}).");
        }

        if (! in_array($decision, ['approve', 'reject'], true)) {
            throw new InvalidArgumentException("Hành động duyệt không hợp lệ. Phải là 'approve' hoặc 'reject'.");
        }

        return DB::transaction(function () use ($booking, $decision, $admin, $reason) {
            // Đảm bảo approval_expires_at còn hạn trong chế độ demo
            if (! $booking->approval_expires_at || now()->gt($booking->approval_expires_at)) {
                $booking->approval_expires_at = now()->addMinutes((int) config('medsi.approval_minutes', 30));
                $booking->save();
            }

            $event = $decision === 'approve' ? BookingEvent::T05 : BookingEvent::T06;

            $updatedBooking = $this->stateMachine->apply($booking, $event, $admin, [
                'reason' => $reason ?? ($decision === 'approve' ? 'Admin approved on behalf of doctor in demo mode' : 'Admin rejected on behalf of doctor in demo mode'),
                'override_role' => 'admin_demo',
            ]);

            $newStatusVal = $updatedBooking->status instanceof BookingStatus ? $updatedBooking->status->value : (string) $updatedBooking->status;

            // Ghi Audit Log AU-17
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'AU-17',
                'entity_type' => 'booking',
                'entity_id' => $booking->id,
                'reason' => "Admin override doctor decision ({$decision}) in demo mode",
                'changes' => [
                    'event' => $event->value,
                    'decision' => $decision,
                    'reject_reason' => $reason,
                    'new_status' => $newStatusVal,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return $updatedBooking;
        });
    }
}
