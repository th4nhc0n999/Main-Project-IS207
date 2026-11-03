<?php

namespace App\Services;

use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Exceptions\Booking\InvalidBookingTransitionException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use ValueError;

class BookingStateMachine
{
    private const SLOT_RELEASE_STATUSES = [
        BookingStatus::PENDING_PAYMENT,
        BookingStatus::PENDING_APPROVAL,
        BookingStatus::CONFIRMED,
    ];

    private const TRANSITIONS = [
        'T02' => ['pending_payment', 'pending_approval'],
        'T02H' => ['pending_payment', 'confirmed'],
        'T03' => ['pending_payment', 'expired'],
        'T04' => ['pending_payment', 'cancelled'],
        'T05' => ['pending_approval', 'confirmed'],
        'T06' => ['pending_approval', 'rejected'],
        'T07' => ['pending_approval', 'expired'],
        'T08' => ['pending_approval', 'cancelled'],
        'T09' => ['confirmed', 'checked_in'],
        'T10' => ['confirmed', 'cancelled'],
        'T11' => ['confirmed', 'no_show'],
        'T12' => ['checked_in', 'completed'],
        'T13' => ['checked_in', 'cancelled'],
    ];

    public function transitionFor(BookingStatus|string|null $current, BookingEvent $event): ?BookingStatus
    {
        $currentValue = $current instanceof BookingStatus ? $current->value : $current;

        if ($event === BookingEvent::T01) {
            if ($currentValue !== null) {
                throw new InvalidBookingTransitionException('T01 chỉ tạo booking mới.');
            }

            return BookingStatus::PENDING_PAYMENT;
        }

        if ($event === BookingEvent::T14) {
            $this->assertCurrent($currentValue, 'pending_payment', $event);

            return BookingStatus::PENDING_PAYMENT;
        }

        if ($event === BookingEvent::T15) {
            return $currentValue === null ? null : BookingStatus::from($currentValue);
        }

        if ($event === BookingEvent::T16) {
            if (! in_array($currentValue, [
                'expired', 'rejected', 'cancelled', 'confirmed',
                'checked_in', 'completed', 'no_show',
            ], true)) {
                throw new InvalidBookingTransitionException('T16 chỉ áp dụng cho lịch đã đóng hoặc đã thanh toán.');
            }

            return BookingStatus::from($currentValue);
        }

        [$expected, $next] = self::TRANSITIONS[$event->value];
        $this->assertCurrent($currentValue, $expected, $event);

        return BookingStatus::from($next);
    }

    /**
     * @param User|string $actor A persisted user, or the trusted system/gateway actor.
     * @param array<string, mixed> $context Non-sensitive event details such as reason and transaction_code.
     */
    public function apply(
        Booking $booking,
        BookingEvent|string $event,
        User|string $actor,
        array $context = []
    ): Booking {
        if (is_string($event)) {
            try {
                $event = BookingEvent::from($event);
            } catch (ValueError) {
                throw new InvalidBookingTransitionException('Sự kiện lịch không hợp lệ.');
            }
        }

        if ($event === BookingEvent::T01) {
            return $this->createBooking($booking, $actor, $context);
        }

        if (! $booking->exists || ! $booking->getKey()) {
            throw new InvalidBookingTransitionException('Booking phải tồn tại trước khi chuyển trạng thái.');
        }

        $bookingId = (int) $booking->getKey();
        $slotId = (int) $booking->getAttribute('slot_id');

        return DB::transaction(function () use ($bookingId, $slotId, $event, $actor, $context): Booking {
            $slot = Slot::query()->lockForUpdate()->findOrFail($slotId);
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($bookingId);
            $current = $lockedBooking->status;
            $next = $this->transitionFor($current, $event);

            $this->authorize($lockedBooking, $event, $actor, $context, $slot);
            $this->assertEventBookingType($lockedBooking, $event);

            if ($event === BookingEvent::T15) {
                $this->assertDuplicateCallback($lockedBooking, $context);

                return $lockedBooking;
            }

            $this->validateEventContext($lockedBooking, $event, $actor, $context, $slot);
            if (in_array($event, [BookingEvent::T02, BookingEvent::T02H], true)) {
                $this->assertPaidWithinHold($lockedBooking);
            }
            if ($event === BookingEvent::T03) {
                $this->assertHoldExpired($lockedBooking);
            }
            if (in_array($event, [BookingEvent::T05, BookingEvent::T07], true)) {
                $this->assertApprovalDeadline($lockedBooking, $event);
            }
            $this->assertTicketState($lockedBooking, $event);
            $oldStatus = $current->value;
            $lockedBooking->status = $next;
            $lockedBooking->version = ((int) $lockedBooking->version) + 1;

            $this->applyBookingMetadata($lockedBooking, $event, $actor, $context);

            if ($this->releasesSlot($current, $next)) {
                $this->releaseSlot($slot);
            }

            if ($event === BookingEvent::T10 && $actor instanceof User && $actor->role === 'doctor') {
                $slot->status = 'blocked';
                $slot->save();
            }

            if ($event === BookingEvent::T03) {
                DB::table('payments')
                    ->where('booking_id', $lockedBooking->getKey())
                    ->whereIn('status', ['pending', 'failed'])
                    ->update(['status' => 'expired', 'updated_at' => now()]);
            }

            if ($event === BookingEvent::T04) {
                DB::table('payments')
                    ->where('booking_id', $lockedBooking->getKey())
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled', 'updated_at' => now()]);
            }

            $lockedBooking->save();
            $this->syncTicket($lockedBooking, $event);
            $this->writeAudit($lockedBooking, $event, $actor, $oldStatus, $next->value, $context);

            return $lockedBooking->refresh();
        });
    }

    private function createBooking(Booking $booking, User|string $actor, array $context): Booking
    {
        if ($booking->exists || ! $booking->slot_id || ! $booking->patient_profile_id || ! $booking->user_id) {
            throw new InvalidBookingTransitionException('T01 cần booking mới có user, hồ sơ và slot hợp lệ.');
        }

        return DB::transaction(function () use ($booking, $actor, $context): Booking {
            $slot = Slot::query()->lockForUpdate()->findOrFail($booking->slot_id);
            $profile = DB::table('patient_profiles')
                ->where('id', $booking->patient_profile_id)
                ->where('user_id', $booking->user_id)
                ->whereNull('deleted_at')
                ->lockForUpdate()
                ->first();

            if (! $profile) {
                throw new InvalidBookingTransitionException('Hồ sơ bệnh nhân không tồn tại hoặc đã được lưu trữ.');
            }

            $this->authorize($booking, BookingEvent::T01, $actor, $context, $slot);
            $this->assertEventBookingType($booking, BookingEvent::T01);

            if ($booking->request_key) {
                $existing = Booking::query()
                    ->where('user_id', $booking->user_id)
                    ->where('request_key', $booking->request_key)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    if ((int) $existing->slot_id !== (int) $booking->slot_id
                        || (int) $existing->patient_profile_id !== (int) $booking->patient_profile_id) {
                        throw new InvalidBookingTransitionException('request_key đã được dùng cho một booking khác.');
                    }

                    return $existing;
                }
            }

            if ($slot->status !== 'available' || $slot->booked_count >= $slot->capacity) {
                throw new SlotUnavailableException('Khung giờ đã hết chỗ.');
            }

            $this->assertSlotOwnerMatchesBooking($booking, $slot);
            $this->assertNoActiveDuplicate($booking);
            $this->assertBookingCreationRules($booking, $slot);

            $oldStatus = null;
            $booking->code = $booking->code ?: 'BK'.now()->format('ymd').Str::upper(Str::random(6));
            $booking->status = BookingStatus::PENDING_PAYMENT;
            $booking->hold_expires_at = now()->addMinutes((int) config('medsi.hold_minutes', 15));
            $booking->version = 1;
            $booking->save();

            $this->createPendingPayment($booking);

            $slot->booked_count++;
            if ($slot->booked_count >= $slot->capacity) {
                $slot->status = 'full';
            }
            $slot->save();

            $this->writeAudit($booking, BookingEvent::T01, $actor, $oldStatus, 'pending_payment', $context);

            return $booking->refresh();
        });
    }

    private function createPendingPayment(Booking $booking): void
    {
        $examFee = $booking->booking_type === 'doctor'
            ? DB::table('doctors')->where('id', $booking->doctor_id)->value('consultation_fee')
            : DB::table('exam_types')
                ->where('id', $booking->exam_type_id)
                ->where('hospital_id', $booking->hospital_id)
                ->value('price');

        if ($examFee === null) {
            throw new InvalidBookingTransitionException('Không xác định được phí khám cho booking.');
        }

        $serviceFee = (int) config('medsi.service_fee_amount', 20000);
        $examFee = (int) $examFee;

        DB::table('payments')->insert([
            'booking_id' => $booking->getKey(),
            'method' => null,
            'exam_fee' => $examFee,
            'discount_amount' => 0,
            'service_fee' => $serviceFee,
            'total_amount' => $examFee + $serviceFee,
            'received_amount' => 0,
            'refunded_amount' => 0,
            'status' => 'pending',
            'paid_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function assertCurrent(?string $current, string $expected, BookingEvent $event): void
    {
        if ($current !== $expected) {
            throw new InvalidBookingTransitionException(sprintf(
                '%s không hợp lệ từ trạng thái %s.',
                $event->value,
                $current ?? 'mới'
            ));
        }
    }

    private function assertEventBookingType(Booking $booking, BookingEvent $event): void
    {
        if ($event === BookingEvent::T02 && $booking->booking_type !== 'doctor') {
            throw new InvalidBookingTransitionException('T02 chỉ áp dụng cho lịch bác sĩ.');
        }

        if ($event === BookingEvent::T02H && $booking->booking_type !== 'hospital') {
            throw new InvalidBookingTransitionException('T02H chỉ áp dụng cho lịch bệnh viện.');
        }

        if (in_array($event, [BookingEvent::T05, BookingEvent::T06], true)
            && $booking->booking_type !== 'doctor') {
            throw new InvalidBookingTransitionException($event->value.' chỉ áp dụng cho lịch bác sĩ.');
        }
    }

    private function authorize(
        Booking $booking,
        BookingEvent $event,
        User|string $actor,
        array $context,
        ?Slot $slot = null
    ): void {
        $role = $actor instanceof User ? (string) $actor->role : $actor;
        $allowed = match ($event) {
            BookingEvent::T01, BookingEvent::T04, BookingEvent::T08 => ['patient', 'admin'],
            BookingEvent::T02 => ['system', 'gateway', 'admin'],
            BookingEvent::T05, BookingEvent::T06 => ['doctor', 'admin'],
            BookingEvent::T02H => ['system', 'gateway'],
            BookingEvent::T03, BookingEvent::T07 => ['system'],
            BookingEvent::T09 => ['staff', 'admin'],
            BookingEvent::T10 => ['patient', 'doctor', 'admin'],
            BookingEvent::T11, BookingEvent::T13 => ['admin'],
            BookingEvent::T12 => ['doctor', 'admin'],
            BookingEvent::T14, BookingEvent::T15, BookingEvent::T16 => ['system', 'gateway'],
        };

        if (! in_array($role, $allowed, true)) {
            throw new InvalidBookingTransitionException('Tác nhân không có quyền thực hiện '.$event->value.'.');
        }

        if ($actor instanceof User && in_array($event, [BookingEvent::T04, BookingEvent::T08, BookingEvent::T10], true)
            && $role === 'patient' && (int) $booking->user_id !== (int) $actor->id) {
            throw new InvalidBookingTransitionException('Bệnh nhân chỉ được thao tác lịch của mình.');
        }

        if ($actor instanceof User && in_array($event, [BookingEvent::T05, BookingEvent::T06, BookingEvent::T10, BookingEvent::T12], true)
            && $role === 'doctor' && ! $this->doctorOwnsBooking($booking, $actor)) {
            throw new InvalidBookingTransitionException('Bác sĩ chỉ được thao tác lịch của mình.');
        }

        if ($event === BookingEvent::T09 && $role === 'staff') {
            if (! $actor instanceof User || ! $slot || ! $this->staffBelongsToBookingHospital($booking, $actor)) {
                throw new InvalidBookingTransitionException('Nhân viên chỉ được check-in lịch tại cơ sở được phân công.');
            }
        }

        if ($event === BookingEvent::T01 && $actor instanceof User && $role === 'patient'
            && (int) $booking->user_id !== (int) $actor->id) {
            throw new InvalidBookingTransitionException('Bệnh nhân chỉ được đặt lịch cho tài khoản của mình.');
        }
    }

    private function validateEventContext(
        Booking $booking,
        BookingEvent $event,
        User|string $actor,
        array $context,
        Slot $slot
    ): void {
        if (in_array($event, [BookingEvent::T06, BookingEvent::T08, BookingEvent::T10, BookingEvent::T13], true)
            && trim((string) ($context['reason'] ?? '')) === '') {
            throw new InvalidBookingTransitionException($event->value.' yêu cầu lý do.');
        }

        if ($event === BookingEvent::T08 && $actor instanceof User && $actor->role === 'patient') {
            $this->assertFreeCancellationWindow($slot);
        }

        if ($event === BookingEvent::T10 && $actor instanceof User && $actor->role === 'patient') {
            $this->assertFreeCancellationWindow($slot);
        }

        if ($event === BookingEvent::T09 && $slot->work_date->toDateString() !== now()->toDateString()) {
            throw new InvalidBookingTransitionException('Chỉ check-in đúng ngày khám.');
        }

        if ($event === BookingEvent::T11) {
            $thresholdMinutes = $booking->booking_type === 'doctor'
                ? (int) config('medsi.no_show_doctor_after_start_minutes', 15)
                : (int) config('medsi.no_show_hospital_after_end_minutes', 120);
            $time = $booking->booking_type === 'doctor' ? $slot->start_time : $slot->end_time;
            $threshold = CarbonImmutable::parse($slot->work_date->toDateString().' '.$time)
                ->addMinutes($thresholdMinutes);

            if (now()->lt($threshold)) {
                throw new InvalidBookingTransitionException('Chưa đến thời điểm xác nhận no-show.');
            }
        }

        if ($event === BookingEvent::T15) {
            $this->assertDuplicateCallback($booking, $context);
        }
    }

    private function assertFreeCancellationWindow(Slot $slot): void
    {
        $slotStart = CarbonImmutable::parse($slot->work_date->toDateString().' '.$slot->start_time);
        $cutoff = $slotStart->subHours((int) config('medsi.free_cancel_hours', 24));

        if (now()->gt($cutoff)) {
            throw new InvalidBookingTransitionException('Lịch còn dưới 24 giờ; vui lòng liên hệ Admin.');
        }
    }

    private function assertDuplicateCallback(Booking $booking, array $context): void
    {
        $transactionCode = (string) ($context['transaction_code'] ?? '');
        $paymentId = DB::table('payments')->where('booking_id', $booking->getKey())->value('id');

        if ($transactionCode === '' || ! $paymentId || ! DB::table('payment_transactions')
            ->where('payment_id', $paymentId)
            ->where('transaction_code', $transactionCode)
            ->exists()) {
            throw new InvalidBookingTransitionException('T15 cần transaction_code đã được xử lý cho payment này.');
        }
    }

    private function assertSlotOwnerMatchesBooking(Booking $booking, Slot $slot): void
    {
        if (! in_array($booking->booking_type, ['doctor', 'hospital'], true)) {
            throw new InvalidBookingTransitionException('Loại booking không hợp lệ.');
        }

        $ownerId = $booking->booking_type === 'doctor' ? $booking->doctor_id : $booking->hospital_id;

        if ($slot->owner_type !== $booking->booking_type || (int) $slot->owner_id !== (int) $ownerId) {
            throw new SlotUnavailableException('Slot không thuộc đối tượng khám đã chọn.');
        }

        if ($booking->booking_type === 'doctor') {
            $doctorMatchesSlot = DB::table('doctors')
                ->where('id', $booking->doctor_id)
                ->where('specialty_id', $slot->specialty_id)
                ->whereNull('deleted_at')
                ->exists();

            if (! $doctorMatchesSlot) {
                throw new InvalidBookingTransitionException('Chuyên khoa của slot không khớp hồ sơ bác sĩ.');
            }
        }

        if ($booking->booking_type === 'hospital') {
            $examType = DB::table('exam_types')
                ->where('id', $booking->exam_type_id)
                ->where('hospital_id', $booking->hospital_id)
                ->whereNull('deleted_at')
                ->first();

            if (! $examType || ($examType->specialty_id !== null
                && (int) $examType->specialty_id !== (int) $slot->specialty_id)) {
                throw new InvalidBookingTransitionException('Loại khám không thuộc bệnh viện hoặc chuyên khoa của slot.');
            }

            $hospitalIsActive = DB::table('hospitals')
                ->where('id', $booking->hospital_id)
                ->whereNull('deleted_at')
                ->exists();

            if (! $hospitalIsActive) {
                throw new InvalidBookingTransitionException('Cơ sở khám không tồn tại hoặc đã lưu trữ.');
            }
        }

        $profileBelongsToUser = DB::table('patient_profiles')
            ->where('id', $booking->patient_profile_id)
            ->where('user_id', $booking->user_id)
            ->exists();

        if (! $profileBelongsToUser) {
            throw new InvalidBookingTransitionException('Hồ sơ bệnh nhân không thuộc tài khoản đặt lịch.');
        }
    }

    private function assertNoActiveDuplicate(Booking $booking): void
    {
        $exists = Booking::query()
            ->where('patient_profile_id', $booking->patient_profile_id)
            ->where('slot_id', $booking->slot_id)
            ->whereIn('status', array_map(fn (BookingStatus $status) => $status->value, [
                BookingStatus::PENDING_PAYMENT,
                BookingStatus::PENDING_APPROVAL,
                BookingStatus::CONFIRMED,
                BookingStatus::CHECKED_IN,
            ]))
            ->exists();

        if ($exists) {
            throw new InvalidBookingTransitionException('Hồ sơ đã có lịch active cho slot này.');
        }
    }

    private function assertBookingCreationRules(Booking $booking, Slot $slot): void
    {
        $profileHasConsent = DB::table('patient_consents')
            ->where('user_id', $booking->user_id)
            ->where('patient_profile_id', $booking->patient_profile_id)
            ->where('is_agreed', true)
            ->whereNull('revoked_at')
            ->exists();

        if (! $profileHasConsent) {
            throw new InvalidBookingTransitionException('Hồ sơ cần có đồng ý dữ liệu còn hiệu lực trước khi đặt lịch.');
        }

        $start = CarbonImmutable::parse($slot->work_date->toDateString().' '.$slot->start_time);
        $minimumLead = $booking->booking_type === 'doctor'
            ? now()->addMinutes((int) config('medsi.min_lead_doctor_minutes', 120))
            : now()->addDays((int) config('medsi.min_lead_hospital_days', 1));
        $maximumDate = now()->addDays((int) config('medsi.max_advance_days', 30));

        if ($start->lt($minimumLead) || $start->gt($maximumDate)) {
            throw new InvalidBookingTransitionException('Thời điểm khám nằm ngoài khoảng thời gian được phép đặt.');
        }

        $activeStatuses = array_map(fn (BookingStatus $status) => $status->value, [
            BookingStatus::PENDING_PAYMENT,
            BookingStatus::PENDING_APPROVAL,
            BookingStatus::CONFIRMED,
            BookingStatus::CHECKED_IN,
        ]);
        $activeCount = Booking::query()
            ->where('patient_profile_id', $booking->patient_profile_id)
            ->whereIn('status', $activeStatuses)
            ->count();

        if ($activeCount >= (int) config('medsi.max_active_bookings_per_profile', 3)) {
            throw new InvalidBookingTransitionException('Hồ sơ đã đạt giới hạn lịch active.');
        }

        $conflictExists = DB::table('bookings as existing')
            ->join('slots as existing_slot', 'existing_slot.id', '=', 'existing.slot_id')
            ->where('existing.patient_profile_id', $booking->patient_profile_id)
            ->whereIn('existing.status', $activeStatuses)
            ->where('existing_slot.work_date', $slot->work_date->toDateString())
            ->where(function ($query) use ($slot): void {
                $query->where('existing_slot.specialty_id', $slot->specialty_id)
                    ->orWhere(function ($overlap) use ($slot): void {
                        $overlap->where('existing_slot.start_time', '<', $slot->end_time)
                            ->where('existing_slot.end_time', '>', $slot->start_time);
                    });
            })
            ->exists();

        if ($conflictExists) {
            throw new InvalidBookingTransitionException('Hồ sơ đã có lịch trùng giờ hoặc cùng chuyên khoa trong ngày.');
        }
    }

    private function assertPaidWithinHold(Booking $booking): void
    {
        $payment = DB::table('payments')->where('booking_id', $booking->getKey())->first();

        if (! $payment || $payment->status !== 'paid'
            || (int) $payment->received_amount !== (int) $payment->total_amount) {
            throw new InvalidBookingTransitionException('Chỉ xác nhận lịch sau khi payment đã paid.');
        }

        if (! $booking->hold_expires_at || now()->gt($booking->hold_expires_at)) {
            throw new InvalidBookingTransitionException('Thanh toán đã quá hạn giữ chỗ; xử lý theo T16.');
        }
    }

    private function assertHoldExpired(Booking $booking): void
    {
        if (! $booking->hold_expires_at) {
            throw new InvalidBookingTransitionException('Booking không có thời hạn giữ chỗ.');
        }

        $deadline = $booking->hold_expires_at;
        $paymentId = DB::table('payments')->where('booking_id', $booking->getKey())->value('id');
        $hasPendingTransaction = $paymentId && DB::table('payment_transactions')
            ->where('payment_id', $paymentId)
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingTransaction) {
            $deadline = $deadline->copy()->addMinutes((int) config('medsi.grace_minutes', 5));
        }

        if (now()->lt($deadline)) {
            throw new InvalidBookingTransitionException('Chưa hết thời hạn giữ chỗ và thời gian chờ.');
        }
    }

    private function assertApprovalDeadline(Booking $booking, BookingEvent $event): void
    {
        if (! $booking->approval_expires_at) {
            throw new InvalidBookingTransitionException('Booking chưa có thời hạn duyệt.');
        }

        if ($event === BookingEvent::T05 && now()->gt($booking->approval_expires_at)) {
            throw new InvalidBookingTransitionException('Đã quá hạn bác sĩ duyệt lịch.');
        }

        if ($event === BookingEvent::T07 && now()->lt($booking->approval_expires_at)) {
            throw new InvalidBookingTransitionException('Chưa hết thời hạn duyệt lịch.');
        }
    }

    private function assertTicketState(Booking $booking, BookingEvent $event): void
    {
        $requiredStatus = match ($event) {
            BookingEvent::T09, BookingEvent::T10, BookingEvent::T11 => 'issued',
            BookingEvent::T12, BookingEvent::T13 => 'checked_in',
            default => null,
        };

        if ($requiredStatus === null) {
            return;
        }

        $ticketExists = DB::table('tickets')
            ->where('booking_id', $booking->getKey())
            ->where('status', $requiredStatus)
            ->exists();

        if (! $ticketExists) {
            throw new InvalidBookingTransitionException('Phiếu khám chưa ở trạng thái cần thiết cho '.$event->value.'.');
        }
    }

    private function releasesSlot(BookingStatus $current, BookingStatus $next): bool
    {
        return in_array($current, self::SLOT_RELEASE_STATUSES, true) && $next->releasesSlot();
    }

    private function releaseSlot(Slot $slot): void
    {
        if ($slot->booked_count < 1) {
            throw new InvalidBookingTransitionException('booked_count không thể nhỏ hơn 0.');
        }

        $slot->booked_count--;
        if ($slot->status === 'full' && $slot->booked_count < $slot->capacity) {
            $slot->status = 'available';
        }
        $slot->save();
    }

    private function applyBookingMetadata(Booking $booking, BookingEvent $event, User|string $actor, array $context): void
    {
        $actorId = $actor instanceof User ? $actor->getKey() : null;

        if (in_array($event, [BookingEvent::T02], true)) {
            $booking->approval_expires_at = now()->addMinutes((int) config('medsi.approval_minutes', 30));
        }

        if (in_array($event, [BookingEvent::T05, BookingEvent::T06], true)) {
            $booking->decided_by = $actorId;
            $booking->decided_at = now();
        }

        if ($event === BookingEvent::T06) {
            $booking->reject_reason = trim((string) $context['reason']);
        }

        if (in_array($event, [BookingEvent::T04, BookingEvent::T08, BookingEvent::T10, BookingEvent::T13], true)) {
            $booking->cancelled_at = now();
            $booking->cancelled_by = $actorId;
            $booking->cancel_reason_code = $context['reason_code'] ?? null;
            $booking->cancel_reason = trim((string) ($context['reason'] ?? '')) ?: null;
        }
    }

    private function syncTicket(Booking $booking, BookingEvent $event): void
    {
        $ticketStatus = match ($event) {
            BookingEvent::T09 => 'checked_in',
            BookingEvent::T10, BookingEvent::T13 => 'cancelled',
            BookingEvent::T11 => 'expired',
            BookingEvent::T12 => 'completed',
            default => null,
        };

        if ($ticketStatus === null) {
            return;
        }

        $changes = ['status' => $ticketStatus, 'updated_at' => now()];
        if ($event === BookingEvent::T09) {
            $changes['check_in_at'] = now();
        }

        DB::table('tickets')->where('booking_id', $booking->getKey())->update($changes);
    }

    private function writeAudit(
        Booking $booking,
        BookingEvent $event,
        User|string $actor,
        ?string $oldStatus,
        string $newStatus,
        array $context
    ): void {
        DB::table('audit_logs')->insert([
            'actor_id' => $actor instanceof User ? $actor->getKey() : null,
            'actor_type' => $actor instanceof User ? 'user' : $actor,
            'action' => $event->value,
            'entity_type' => 'booking',
            'entity_id' => $booking->getKey(),
            'reason' => isset($context['reason']) ? mb_substr((string) $context['reason'], 0, 255) : null,
            'changes' => json_encode(['from' => $oldStatus, 'to' => $newStatus], JSON_THROW_ON_ERROR),
            'ip_address' => $context['ip_address'] ?? null,
            'occurred_at' => now(),
        ]);
    }

    private function doctorOwnsBooking(Booking $booking, User $actor): bool
    {
        return $booking->doctor_id !== null && DB::table('doctors')
            ->where('id', $booking->doctor_id)
            ->where('user_id', $actor->getKey())
            ->exists();
    }

    private function staffBelongsToBookingHospital(Booking $booking, User $actor): bool
    {
        $hospitalId = $booking->hospital_id;

        if ($hospitalId === null && $booking->doctor_id !== null) {
            $hospitalId = DB::table('doctors')->where('id', $booking->doctor_id)->value('hospital_id');
        }

        return $hospitalId !== null && (int) $actor->hospital_id === (int) $hospitalId;
    }
}