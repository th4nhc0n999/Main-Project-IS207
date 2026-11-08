<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class BookingReadService
{
    public function query(User $user): Builder
    {
        abort_unless(in_array($user->role, ['patient', 'admin'], true), 403);

        $query = DB::table('bookings as b')
            ->join('slots as s', 's.id', '=', 'b.slot_id')
            ->join('specialties as sp', 'sp.id', '=', 's.specialty_id')
            ->leftJoin('doctors as d', 'd.id', '=', 'b.doctor_id')
            ->leftJoin('hospitals as h', fn ($join) => $join->on('h.id', '=', DB::raw('COALESCE(b.hospital_id, d.hospital_id)')))
            ->leftJoin('exam_types as e', 'e.id', '=', 'b.exam_type_id')
            ->leftJoin('payments as p', 'p.booking_id', '=', 'b.id')
            ->leftJoin('tickets as t', 't.booking_id', '=', 'b.id')
            ->select([
                'b.*', 's.work_date', 's.start_time', 's.end_time', 's.specialty_id',
                'sp.name as specialty_name', 'h.name as hospital_name', 'h.address as hospital_address',
                'd.name as doctor_name', 'e.name as exam_type_name',
                'p.id as payment_id', 'p.status as payment_status', 'p.method as payment_method',
                'p.exam_fee', 'p.service_fee', 'p.discount_amount', 'p.total_amount', 'p.received_amount', 'p.refunded_amount',
                't.id as ticket_id', 't.ticket_code', 't.status as ticket_status', 't.queue_number',
                't.room_number', 't.instructions', 't.check_in_at',
            ]);

        return $user->role === 'admin' ? $query : $query->where('b.user_id', $user->id);
    }

    public function detail(User $user, int $bookingId): array
    {
        $booking = $this->serialize($this->query($user)->where('b.id', $bookingId)->firstOrFail());
        if ($booking['payment']) {
            $booking['payment']['pending_transaction_code'] = DB::table('payment_transactions')
                ->where('payment_id', $booking['payment']['id'])->where('status', 'pending')
                ->value('transaction_code');
            $booking['payment']['grace_minutes'] = (int) config('medsi.grace_minutes');
        }
        return $booking;
    }

    public function serialize(object $row): array
    {
        $snapshot = json_decode($row->patient_snapshot, true, flags: JSON_THROW_ON_ERROR);
        $payment = null;
        if ($row->payment_id !== null) {
            $payment = ['id' => $row->payment_id, 'status' => $row->payment_status, 'method' => $row->payment_method];
            foreach (['exam_fee', 'service_fee', 'discount_amount', 'total_amount', 'received_amount', 'refunded_amount'] as $field) {
                $payment[$field] = (int) $row->$field;
            }
        }

        return [
            'id' => $row->id, 'code' => $row->code, 'user_id' => $row->user_id,
            'booking_type' => $row->booking_type, 'status' => $row->status,
            'patient_profile_id' => $row->patient_profile_id, 'patient_snapshot' => $snapshot,
            'doctor_id' => $row->doctor_id, 'doctor_name' => $row->doctor_name,
            'hospital_id' => $row->hospital_id, 'hospital_name' => $row->hospital_name,
            'hospital_address' => $row->hospital_address, 'exam_type_id' => $row->exam_type_id,
            'exam_type_name' => $row->exam_type_name, 'specialty_name' => $row->specialty_name,
            'slot_id' => $row->slot_id, 'work_date' => $row->work_date,
            'start_time' => $row->start_time, 'end_time' => $row->end_time,
            'hold_expires_at' => $row->hold_expires_at ? CarbonImmutable::parse($row->hold_expires_at)->toIso8601String() : null,
            'created_at' => $row->created_at, 'payment' => $payment,
            'ticket' => $row->ticket_id === null ? null : [
                'id' => $row->ticket_id, 'ticket_code' => $row->ticket_code,
                'status' => $row->ticket_status, 'queue_number' => $row->queue_number,
                'room_number' => $row->room_number, 'instructions' => $row->instructions,
                'check_in_at' => $row->check_in_at,
            ],
        ];
    }
}
