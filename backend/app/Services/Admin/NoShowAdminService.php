<?php

namespace App\Services\Admin;

use App\Enums\BookingEvent;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\User;
use App\Services\BookingStateMachine;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class NoShowAdminService
{
    public function __construct(
        protected BookingStateMachine $stateMachine
    ) {}

    /**
     * Tra cứu danh sách các lịch confirmed đã đủ điều kiện đánh dấu No-show:
     * - Bác sĩ: quá giờ bắt đầu slot 15 phút mà vé chưa check-in.
     * - Bệnh viện: quá giờ kết thúc ca 120 phút mà vé chưa check-in.
     */
    public function listEligible(): Collection
    {
        $docThresholdMinutes = (int) config('medsi.no_show_doctor_after_start_minutes', 15);
        $hospThresholdMinutes = (int) config('medsi.no_show_hospital_after_end_minutes', 120);

        // Lấy tất cả lịch confirmed kèm slot và ticket
        $confirmedBookings = Booking::with(['slot', 'doctor', 'hospital', 'patientProfile'])
            ->where('status', 'confirmed')
            ->get();

        $eligible = new Collection();
        $now = CarbonImmutable::now('Asia/Ho_Chi_Minh');

        foreach ($confirmedBookings as $booking) {
            $slot = $booking->slot;
            if (! $slot) {
                continue;
            }

            // Kiểm tra ticket xem đã check_in chưa
            $ticket = Ticket::where('booking_id', $booking->id)->first();
            if ($ticket && in_array($ticket->status, ['checked_in', 'completed'], true)) {
                continue;
            }

            $thresholdMinutes = $booking->booking_type === 'doctor' ? $docThresholdMinutes : $hospThresholdMinutes;
            $time = $booking->booking_type === 'doctor' ? $slot->start_time : $slot->end_time;
            
            // Xử lý work_date để lấy đúng định dạng Y-m-d
            $rawDate = $slot->work_date;
            if ($rawDate instanceof \DateTimeInterface) {
                $dateStr = $rawDate->format('Y-m-d');
            } else {
                $dateStr = substr((string) $rawDate, 0, 10);
            }

            $deadline = CarbonImmutable::parse("{$dateStr} {$time}", 'Asia/Ho_Chi_Minh')->addMinutes($thresholdMinutes);

            if ($now->gte($deadline)) {
                $eligible->push($booking);
            }
        }

        return $eligible;
    }

    /**
     * Admin xác nhận ghi vắng (T11):
     * - Chuyển booking sang 'no_show'.
     * - Chuyển ticket sang 'expired'.
     * - Hoàn 0đ (theo dòng 12 chính sách hoàn tiền).
     * - Ghi Audit Log có actor_id là Admin xác nhận.
     */
    public function confirmNoShow(int $bookingId, User $admin, ?string $reason = null): Booking
    {
        return DB::transaction(function () use ($bookingId, $admin, $reason) {
            $booking = Booking::with('slot')->findOrFail($bookingId);

            // Chuyển trạng thái qua BookingStateMachine với event T11
            $updatedBooking = $this->stateMachine->apply($booking, BookingEvent::T11, $admin, [
                'reason' => $reason ?? 'Bệnh nhân không đến khám đúng giờ hẹn (Admin xác nhận ghi vắng)',
                'confirmed_by' => $admin->id,
            ]);

            // Ghi Audit Log hành động Admin xác nhận vắng mặt
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'T11',
                'entity_type' => 'booking',
                'entity_id' => $updatedBooking->id,
                'reason' => $reason ?? 'Xác nhận bệnh nhân vắng mặt (No-Show E12)',
                'changes' => [
                    'from' => 'confirmed',
                    'to' => 'no_show',
                    'ticket_status' => 'expired',
                    'refund_amount' => 0,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return $updatedBooking;
        });
    }

    /**
     * Tiếp nhận và xử lý khiếu nại No-show của bệnh nhân (E12 step 3 / Admin override):
     * - Nếu chấp thuận khiếu nại (bệnh nhân có lý do chính đáng: cấp cứu, tai nạn, sự cố bất khả kháng):
     *   Admin tạo yêu cầu hoàn tiền đặc biệt (theo chính sách dòng 12 Admin duyệt khiếu nại).
     * - Nếu bác bỏ: lưu ghi chú từ chối khiếu nại vào AuditLog.
     */
    public function handleComplaint(int $bookingId, string $resolution, User $admin, string $notes): array
    {
        if (! in_array($resolution, ['accept', 'reject'], true)) {
            throw new InvalidArgumentException("Phương án giải quyết phải là 'accept' hoặc 'reject'.");
        }

        return DB::transaction(function () use ($bookingId, $resolution, $admin, $notes) {
            $booking = Booking::with(['payment'])->findOrFail($bookingId);

            $statusValue = $booking->status instanceof \App\Enums\BookingStatus ? $booking->status->value : (string) $booking->status;

            if ($statusValue !== 'no_show') {
                throw new InvalidArgumentException("Chỉ có thể xử lý khiếu nại cho lịch ở trạng thái 'no_show' (hiện tại: {$statusValue}).");
            }

            $refund = null;
            if ($resolution === 'accept') {
                $payment = $booking->payment;
                if (! $payment) {
                    throw new InvalidArgumentException('Không tìm thấy bản ghi thanh toán của lịch khám để hoàn tiền.');
                }

                // Tạo yêu cầu hoàn tiền theo phê duyệt khiếu nại (hoàn 100% phí khám)
                $refundAmount = (float) $payment->exam_fee;
                $refund = Refund::create([
                    'payment_id' => $payment->id,
                    'booking_id' => $booking->id,
                    'amount' => $refundAmount,
                    'exam_fee_refunded' => $refundAmount,
                    'service_fee_refunded' => 0,
                    'policy_case' => 'no_show_complaint_accepted',
                    'reason' => "Khiếu nại được Admin chấp thuận: {$notes}",
                    'status' => 'approved',
                    'refund_ref' => 'REF-COMPLAINT-' . strtoupper(Str::random(8)),
                    'requested_by' => $admin->id,
                    'approved_by' => $admin->id,
                    'requested_at' => now(),
                ]);
            }

            // Ghi Audit Log cho khiếu nại
            AuditLog::create([
                'actor_id' => $admin->id,
                'actor_type' => 'user',
                'action' => 'AU-11',
                'entity_type' => 'booking',
                'entity_id' => $booking->id,
                'reason' => "Admin giải quyết khiếu nại vắng mặt ({$resolution}): {$notes}",
                'changes' => [
                    'resolution' => $resolution,
                    'notes' => $notes,
                    'refund_created' => $refund ? $refund->refund_ref : null,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'occurred_at' => now(),
            ]);

            return [
                'booking_id' => $booking->id,
                'resolution' => $resolution,
                'notes' => $notes,
                'refund' => $refund,
            ];
        });
    }
}
