<?php

namespace App\Services;

use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Enums\TicketStatus;
use App\Exceptions\Booking\TicketException;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TicketService
{
    public function __construct(private readonly TicketQrService $qr) {}

    public function issue(Booking $booking): Ticket
    {
        return DB::transaction(function () use ($booking): Ticket {
            // Same lock order as BookingStateMachine. The owner lock serializes
            // the entire queue scope, including its first ticket and other slots.
            $slot = Slot::query()->lockForUpdate()->findOrFail($booking->slot_id);
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            if ($lockedBooking->status !== BookingStatus::CONFIRMED) {
                throw new TicketException('Chỉ phát hành phiếu cho lịch đã xác nhận.', 'EX-TKT-02');
            }

            $ownerTable = $slot->owner_type === 'hospital' ? 'hospitals' : 'doctors';
            DB::table($ownerTable)->where('id', $slot->owner_id)->lockForUpdate()->firstOrFail();
            $existing = Ticket::query()->where('booking_id', $lockedBooking->id)->lockForUpdate()->first();
            if ($existing) {
                return $existing;
            }

            $specialty = DB::table('specialties')->find($slot->specialty_id);
            $scope = implode(':', [$slot->owner_type, $slot->owner_id, $slot->specialty_id, $slot->work_date->toDateString()]);
            // A locking read sees the latest committed sequence under MySQL RR.
            $last = Ticket::query()->where('queue_scope', $scope)->orderByDesc('queue_seq')->lockForUpdate()->first();
            $sequence = ($last?->queue_seq ?? 0) + 1;
            $code = 'TKT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));

            return Ticket::query()->create([
                'booking_id' => $lockedBooking->id,
                'ticket_code' => $code,
                'qr_token' => $this->qr->sign($code, $slot->work_date->toDateString()),
                'queue_scope' => $scope,
                'queue_seq' => $sequence,
                'queue_number' => $specialty->code.'-'.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                'status' => TicketStatus::ISSUED,
                'instructions' => $specialty->default_instructions,
            ]);
        }, 5);
    }

    public function checkIn(string $token, User $actor, ?string $ipAddress = null): Ticket
    {
        abort_unless(in_array($actor->role, ['staff', 'admin'], true), 403);
        $code = $this->qr->verify($token);
        $ticket = Ticket::query()->where('ticket_code', $code)->first();
        if (! $ticket || ! hash_equals($ticket->qr_token, $token)) {
            throw new TicketException('Không tìm thấy phiếu khám hợp lệ.');
        }
        $booking = Booking::query()->findOrFail($ticket->booking_id);

        return DB::transaction(function () use ($booking, $ticket, $actor, $ipAddress): Ticket {
            $slot = Slot::query()->lockForUpdate()->findOrFail($booking->slot_id);
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $lockedTicket = Ticket::query()->lockForUpdate()->findOrFail($ticket->id);

            $hospitalId = $lockedBooking->hospital_id;
            if ($hospitalId === null && $lockedBooking->doctor_id !== null) {
                $hospitalId = DB::table('doctors')->where('id', $lockedBooking->doctor_id)->value('hospital_id');
            }
            abort_if($actor->role === 'staff' && ($hospitalId === null || (int) $actor->hospital_id !== (int) $hospitalId), 403);

            if ($slot->work_date->toDateString() !== now()->toDateString()) {
                throw new TicketException('Chỉ tiếp nhận đúng ngày hẹn.', 'EX-TKT-02');
            }
            if ($lockedTicket->status === TicketStatus::CHECKED_IN) {
                throw new TicketException('Phiếu đã được check-in.', 'EX-TKT-02', 409);
            }
            if ($lockedTicket->status !== TicketStatus::ISSUED || $lockedBooking->status !== BookingStatus::CONFIRMED) {
                throw new TicketException('Phiếu không còn hiệu lực tiếp nhận.', 'EX-TKT-02');
            }

            app(BookingStateMachine::class)->apply($lockedBooking, BookingEvent::T09, $actor, ['ip_address' => $ipAddress]);

            return $lockedTicket->refresh();
        }, 5);
    }
}
