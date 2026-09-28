<?php

namespace App\Services\Payment;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Slot;
use DomainException;
use Illuminate\Support\Facades\DB;

/** Payment-side hold lifecycle. M5 creates the hold and increments capacity. */
class SlotHoldService
{
    /** Must run inside a transaction. Lock order matches hospital booking: slot -> booking -> payment. */
    public function lockBooking(Booking $reference): Booking
    {
        if (DB::transactionLevel() === 0) {
            throw new \LogicException('Slot hold locking requires a transaction.');
        }

        $slot = Slot::query()->whereKey($reference->slot_id)->lockForUpdate()->firstOrFail();
        $booking = Booking::query()->whereKey($reference->id)->lockForUpdate()->firstOrFail();
        if ($booking->slot_id !== $slot->id) {
            throw new DomainException('Khung giờ của đơn đặt khám đã thay đổi. Vui lòng tải lại.');
        }

        return $booking->setRelation('slot', $slot);
    }

    public function isOverdue(Booking $booking): bool
    {
        return $booking->booking_type === 'hospital'
            && $booking->status === 'pending_payment'
            && $booking->slot_hold_expires_at !== null
            && now()->greaterThanOrEqualTo($booking->slot_hold_expires_at);
    }

    /** Caller holds slot and booking locks. Returns true only for the first release. */
    public function releaseIfOverdue(Booking $booking): bool
    {
        if (! $this->isOverdue($booking)) {
            return false;
        }

        $payment = Payment::query()->where('booking_id', $booking->id)->lockForUpdate()->first();
        if ($payment?->isPaid() || $payment?->isRefunded()) {
            return false;
        }

        // FAILED/CANCELLED remain their original result; their booking hold still expires.
        if ($payment?->isPending()) {
            $payment->status = PaymentStatus::EXPIRED;
            $payment->save();
        }

        $booking->status = 'cancelled';
        // Preserve the deadline for troubleshooting and expired-hold responses.
        $booking->save();
        $slot = $booking->slot;
        if ($slot->booked_count > 0) {
            $slot->booked_count--;
        }
        if ($slot->status === 'full' && $slot->booked_count < $slot->capacity) {
            $slot->status = 'available';
        }
        $slot->save();

        return true;
    }

    public function releaseOverdueHoldsForSlot(int|Slot $slotParam): int
    {
        $slotId = $slotParam instanceof Slot ? $slotParam->id : $slotParam;

        $overdueBookings = Booking::query()
            ->where('slot_id', $slotId)
            ->where('booking_type', 'hospital')
            ->where('status', 'pending_payment')
            ->where('slot_hold_expires_at', '<=', now())
            ->lockForUpdate()
            ->get();

        $count = 0;
        foreach ($overdueBookings as $booking) {
            $lockedBooking = $this->lockBooking($booking);
            if ($this->releaseIfOverdue($lockedBooking)) {
                $count++;
            }
        }

        return $count;
    }

    public function expireOverdueHolds(): int
    {
        $count = 0;
        Booking::query()->where('booking_type', 'hospital')
            ->where('status', 'pending_payment')
            ->where('slot_hold_expires_at', '<=', now())
            ->chunkById(100, function ($bookings) use (&$count): void {
                foreach ($bookings as $reference) {
                    $count += (int) DB::transaction(function () use ($reference): bool {
                        return $this->releaseIfOverdue($this->lockBooking($reference));
                    }, 3);
                }
            });

        return $count;
    }
}
