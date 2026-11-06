<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RefundAdminService
{
    /**
     * Tra cứu danh sách hoàn tiền (có thể lọc theo status).
     */
    public function list(?string $status = null): Collection
    {
        $query = Refund::with(['booking', 'payment', 'requestedUser', 'approvedUser'])
            ->latest('id');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }

    /**
     * Xem chi tiết một yêu cầu hoàn tiền.
     */
    public function find(int $id): Refund
    {
        return Refund::with(['booking', 'payment', 'requestedUser', 'approvedUser'])->findOrFail($id);
    }

    /**
     * Quyết định của Admin: Duyệt (approved) hoặc Từ chối (rejected).
     */
    public function decide(int $id, string $decision, User $admin, ?string $reason = null): Refund
    {
        if (! in_array($decision, ['approve', 'reject'], true)) {
            throw new InvalidArgumentException("Hành động không hợp lệ. Phải là 'approve' hoặc 'reject'.");
        }

        return DB::transaction(function () use ($id, $decision, $admin, $reason) {
            $refund = Refund::findOrFail($id);

            // Máy trạng thái hoàn tiền (Tài liệu thống nhất v1.0 Mục 3):
            // requested -> approved, rejected; hoặc failed -> approved (duyệt lại)
            if (! in_array($refund->status, ['requested', 'failed'], true) && $decision === 'approve') {
                throw new InvalidArgumentException("Chỉ có thể duyệt yêu cầu hoàn tiền khi ở trạng thái 'requested' hoặc 'failed' (hiện tại: {$refund->status}).");
            }

            if ($refund->status !== 'requested' && $decision === 'reject') {
                throw new InvalidArgumentException("Chỉ có thể từ chối yêu cầu hoàn tiền khi ở trạng thái 'requested' (hiện tại: {$refund->status}).");
            }

            $refund->status = $decision === 'approve' ? 'approved' : 'rejected';
            $refund->approved_by = $admin->id;
            if ($reason) {
                $refund->reason = $reason;
            }
            $refund->save();

            // Ghi Audit Log AU-16 / Event kiểm toán hoàn tiền
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'AU-16',
                'entity_type' => 'refund',
                'entity_id' => $refund->id,
                'reason' => "Admin {$decision} refund request #{$refund->refund_ref}",
                'changes' => [
                    'decision' => $decision,
                    'amount' => $refund->amount,
                    'status' => $refund->status,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return $refund;
        });
    }

    /**
     * Xử lý giải ngân mô phỏng: chuyển từ approved/processing sang succeeded.
     * Cập nhật payments.refunded_amount và payments.status.
     */
    public function processSimulatedSuccess(int $id, User $admin): Refund
    {
        return DB::transaction(function () use ($id, $admin) {
            $refund = Refund::with('payment')->findOrFail($id);

            // Máy trạng thái hoàn tiền: approved -> processing -> succeeded
            if (! in_array($refund->status, ['approved', 'processing'], true)) {
                throw new InvalidArgumentException("Yêu cầu hoàn tiền phải được duyệt (approved/processing) trước khi giải ngân (hiện tại: {$refund->status}).");
            }

            $payment = $refund->payment;
            if (! $payment) {
                throw new InvalidArgumentException('Không tìm thấy thông tin thanh toán liên kết với hoàn tiền.');
            }

            // Kiểm tra ràng buộc CHECK: refunded_amount <= received_amount
            $newRefundedAmount = (float) $payment->refunded_amount + (float) $refund->amount;
            if ($newRefundedAmount > (float) $payment->received_amount) {
                throw new InvalidArgumentException("Số tiền hoàn ({$newRefundedAmount}) vượt quá tổng tiền thực thu ({$payment->received_amount}).");
            }

            // Cập nhật Payment
            $payment->refunded_amount = $newRefundedAmount;
            if ($newRefundedAmount >= (float) $payment->received_amount) {
                $payment->status = 'refunded';
            }
            $payment->save();

            // Cập nhật Refund thành succeeded
            $refund->status = 'succeeded';
            $refund->processed_at = now();
            $refund->save();

            // Ghi Audit Log AU-16
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'AU-16',
                'entity_type' => 'refund',
                'entity_id' => $refund->id,
                'reason' => "Admin completed refund execution (succeeded) for ref #{$refund->refund_ref}",
                'changes' => [
                    'status' => 'succeeded',
                    'refunded_amount' => $refund->amount,
                    'total_payment_refunded' => $payment->refunded_amount,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return $refund;
        });
    }
}

