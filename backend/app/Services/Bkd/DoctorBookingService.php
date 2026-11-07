<?php

namespace App\Services\Bkd;

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\BookingRefund;
use App\Contracts\Bkd\BookingTicket;
use App\Contracts\Bkd\PatientSnapshot;
use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Exceptions\Booking\BkdException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use App\Services\BookingStateMachine;
use App\Support\Bkd\SensitiveData;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DoctorBookingService
{
    public function __construct(private BookingStateMachine $machine, private DoctorSlotService $slots) {}

    public function create(User $actor, array $data): Booking
    {
        return DB::transaction(function () use ($actor, $data): Booking {
            // Serializes request_key reuse across different profiles/slots of one account.
            User::query()->lockForUpdate()->findOrFail($actor->id);
            $existing = Booking::query()->where('user_id', $actor->id)
                ->where('request_key', $data['request_key'])->first();
            if ($existing) {
                $same = $existing->booking_type === 'doctor'
                    && (int) $existing->doctor_id === (int) $data['doctor_id']
                    && (int) $existing->slot_id === (int) $data['slot_id']
                    && (int) $existing->patient_profile_id === (int) $data['patient_profile_id']
                    && ($existing->symptoms ?? null) === ($data['symptoms'] ?? null);
                if (! $same) {
                    throw new BkdException('request_key đã được dùng với nội dung khác.', 409, 'IDEMPOTENCY_CONFLICT');
                }

                return $existing;
            }
            $slot = Slot::query()->lockForUpdate()->findOrFail($data['slot_id']);
            $profile = DB::table('patient_profiles')->where('id', $data['patient_profile_id'])
                ->where('user_id', $actor->id)->whereNull('deleted_at')->lockForUpdate()->first();
            abort_if(! $profile, 404);
            $active = array_map(fn ($s) => $s->value,
                array_filter(BookingStatus::cases(), fn ($s) => $s->isActive()));
            $conflict = DB::table('bookings as b')->join('slots as s', 's.id', '=', 'b.slot_id')
                ->where('b.patient_profile_id', $profile->id)->whereIn('b.status', $active)
                ->where('s.work_date', $slot->work_date->toDateString())
                ->where(fn ($q) => $q->where('s.specialty_id', $slot->specialty_id)
                    ->orWhere(fn ($hours) => $hours->where('s.start_time', '<', $slot->end_time)
                        ->where('s.end_time', '>', $slot->start_time)))->exists();
            if ($conflict) {
                throw new SlotUnavailableException('Hồ sơ đã có lịch giao giờ hoặc cùng chuyên khoa trong ngày.');
            }
            $snapshot = $this->dependency(PatientSnapshot::class)->makePatientSnapshot($profile);
            $this->assertMaskedSnapshot($snapshot);
            $payment = $this->dependency(BookingPayment::class);
            $booking = new Booking([
                'user_id' => $actor->id, 'patient_profile_id' => $profile->id,
                'booking_type' => 'doctor', 'doctor_id' => $data['doctor_id'],
                'hospital_id' => null, 'exam_type_id' => null, 'slot_id' => $data['slot_id'],
                'symptoms' => $data['symptoms'] ?? null, 'patient_snapshot' => $snapshot,
                'request_key' => $data['request_key'],
            ]);
            $booking = $this->machine->apply($booking, BookingEvent::T01, $actor, [
                'patient_snapshot' => $snapshot,
            ]);
            $payment->ensurePendingPayment($booking);

            return $booking;
        }, 3);
    }

    public function listing(User $actor, array $filters, bool $forDoctor)
    {
        $query = Booking::query()->where('booking_type', 'doctor');
        if ($forDoctor) {
            $query->where('doctor_id', $this->slots->doctorFor($actor)->id);
        } else {
            $query->where('user_id', $actor->id);
        }
        $query->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['date'] ?? null, fn ($q, $date) => $q->whereIn('slot_id',
                Slot::query()->select('id')->whereDate('work_date', $date)));

        return $query->orderByDesc('id')->paginate($filters['per_page'] ?? 20);
    }

    public function detail(User $actor, int $id): Booking
    {
        $booking = Booking::query()->where('booking_type', 'doctor')->findOrFail($id);
        $this->authorize($actor, $booking);

        return $booking;
    }

    public function decide(User $actor, int $id, bool $approve, array $data): Booking
    {
        return $this->mutate($actor, $id, $data['version'], function (Booking $booking) use ($actor, $approve, $data): Booking {
            if ($actor->role !== 'doctor') {
                throw new AuthorizationException;
            }
            if ($booking->status !== BookingStatus::PENDING_APPROVAL || ! $booking->approval_expires_at
                || now()->gte($booking->approval_expires_at)) {
                throw new BkdException('Lịch không còn chờ duyệt hoặc đã hết hạn duyệt.');
            }
            $event = $approve ? BookingEvent::T05 : BookingEvent::T06;
            $dependency = $this->dependency($approve ? BookingTicket::class : BookingRefund::class);
            $booking = $this->machine->apply($booking, $event, $actor, [
                'reason' => SensitiveData::maskText($data['reason'] ?? null),
            ]);
            if ($approve) {
                $dependency->issueFor($booking);
            } else {
                $dependency->requestFor($booking, $event, $actor);
            }

            return $booking;
        });
    }

    public function cancel(User $actor, int $id, array $data): Booking
    {
        return $this->mutate($actor, $id, $data['version'], function (Booking $booking) use ($actor, $data): Booking {
            $event = match ($booking->status) {
                BookingStatus::PENDING_PAYMENT => BookingEvent::T04,
                BookingStatus::PENDING_APPROVAL => BookingEvent::T08,
                BookingStatus::CONFIRMED => BookingEvent::T10,
                default => throw new BkdException('Không thể huỷ lịch ở trạng thái hiện tại.'),
            };
            if ($actor->role === 'doctor' && $event !== BookingEvent::T10) {
                throw new BkdException('Bác sĩ chỉ huỷ lịch đã xác nhận khi nghỉ đột xuất.');
            }
            if (! in_array($actor->role, ['patient', 'doctor'], true)) {
                throw new AuthorizationException;
            }
            $refund = $event === BookingEvent::T04 ? null : $this->dependency(BookingRefund::class);
            $booking = $this->machine->apply($booking, $event, $actor, [
                'reason' => SensitiveData::maskText($data['reason']), 'reason_code' => $data['reason_code'] ?? null,
            ]);
            $refund?->requestFor($booking, $event, $actor);

            return $booking;
        });
    }

    public function present(Booking $booking): Booking
    {
        $booking->setRelation('bkdSlot', Slot::query()->findOrFail($booking->slot_id));
        $booking->setRelation('bkdPayment', DB::table('payments')->where('booking_id', $booking->id)->first());

        return $booking;
    }

    private function mutate(User $actor, int $id, int $version, callable $action): Booking
    {
        $original = $this->detail($actor, $id);

        return DB::transaction(function () use ($actor, $original, $version, $action): Booking {
            // Match the state machine lock order: slot, then booking.
            Slot::query()->lockForUpdate()->findOrFail($original->slot_id);
            $booking = Booking::query()->lockForUpdate()->findOrFail($original->id);
            $this->authorize($actor, $booking);
            if ($booking->version !== $version) {
                throw new BkdException('Lịch đã thay đổi. Vui lòng tải lại.', 409, 'STALE_VERSION');
            }

            return $action($booking);
        }, 3);
    }

    private function authorize(User $actor, Booking $booking): void
    {
        $allowed = match ($actor->role) {
            'patient' => (int) $booking->user_id === $actor->id,
            'doctor' => (int) $booking->doctor_id === (int) $this->slots->doctorFor($actor)->id,
            default => false,
        };
        if (! $allowed) {
            throw new AuthorizationException;
        }
    }

    private function dependency(string $contract): object
    {
        if (! app()->bound($contract)) {
            throw new BkdException('Dịch vụ tích hợp chưa sẵn sàng. Vui lòng thử lại sau.', 503, 'BKD_INTEGRATION_UNAVAILABLE');
        }

        return app($contract);
    }

    private function assertMaskedSnapshot(array $snapshot): void
    {
        // Refuse a broken adapter instead of persisting sensitive profile fields.
        $sensitive = ['phone', 'identity_card_number', 'health_insurance_code', 'guardian_phone'];
        $allowed = array_merge($sensitive, ['full_name', 'dob', 'gender', 'relationship',
            'guardian_name', 'guardian_relationship']);
        if (array_diff(array_keys($snapshot), $allowed) !== [] || empty($snapshot['full_name'])) {
            throw new BkdException('Snapshot hồ sơ không đúng hợp đồng tích hợp.', 503, 'BKD_INTEGRATION_UNAVAILABLE');
        }
        foreach ($sensitive as $key) {
            $value = $snapshot[$key] ?? null;
            if (! SensitiveData::isMaskedIdentifier($value, $key === 'health_insurance_code')) {
                throw new BkdException('Snapshot hồ sơ chưa được che dữ liệu.', 503, 'BKD_INTEGRATION_UNAVAILABLE');
            }
        }
    }
}
