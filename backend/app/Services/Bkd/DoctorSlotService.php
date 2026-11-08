<?php

namespace App\Services\Bkd;

use App\Enums\BookingStatus;
use App\Exceptions\Booking\BkdException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DoctorSlotService
{
    public function profileFor(User $actor): array
    {
        $doctor = DB::table('doctors as d')
            ->leftJoin('specialties as s', 's.id', '=', 'd.specialty_id')
            ->where('d.user_id', $actor->id)->whereNull('d.deleted_at')
            ->first(['d.id', 'd.name', 'd.specialty_id', 's.name as specialty_name']);
        if (! $doctor) {
            throw new BkdException('Tài khoản chưa có hồ sơ bác sĩ.', 404, 'NOT_FOUND');
        }

        return ['doctor_id' => (int) $doctor->id, 'name' => $doctor->name,
            'specialty' => ['id' => (int) $doctor->specialty_id, 'name' => $doctor->specialty_name]];
    }

    public function listOwn(User $actor, string $date)
    {
        $profile = $this->profileFor($actor);

        // Management view includes all slots of the day, even past/full/blocked slots.
        return Slot::query()->where('owner_type', 'doctor')->where('owner_id', $profile['doctor_id'])
            ->whereDate('work_date', $date)->orderBy('start_time')->get();
    }

    public function list(int $doctorId, string $date)
    {
        $this->doctor($doctorId);

        return Slot::query()->where('owner_type', 'doctor')->where('owner_id', $doctorId)
            ->whereDate('work_date', $date)
            ->where(function ($query): void {
                $query->where('work_date', '>', now()->toDateString())
                    ->orWhere(fn ($today) => $today->where('work_date', now()->toDateString())
                        ->where('start_time', '>', now()->format('H:i:s')));
            })->orderBy('start_time')->get();
    }

    public function doctorFor(User $actor): object
    {
        $doctor = DB::table('doctors')->where('user_id', $actor->id)->whereNull('deleted_at')->first();
        if (! $doctor) {
            throw new AuthorizationException;
        }

        return $doctor;
    }

    public function create(User $actor, array $data): Slot
    {
        $doctorId = (int) $this->doctorFor($actor)->id;

        return DB::transaction(function () use ($actor, $doctorId, $data): Slot {
            // Serializes competing slot creations, including overlapping start times.
            $doctor = $this->doctor($doctorId, true);
            [$start, $end] = $this->times($data);
            $this->assertNoOverlap($doctorId, $data['work_date'], $start, $end);
            $slot = Slot::query()->create([
                'owner_type' => 'doctor', 'owner_id' => $doctorId,
                'specialty_id' => $doctor->specialty_id, 'work_date' => $data['work_date'],
                'start_time' => $start->format('H:i:s'), 'end_time' => $end->format('H:i:s'),
                'capacity' => 1, 'booked_count' => 0, 'status' => 'available',
            ]);
            $this->audit($actor, $slot, 'bkd.slot.created');

            return $slot;
        }, 3);
    }

    public function update(User $actor, int $id, array $data): Slot
    {
        return $this->change($actor, $id, function (Slot $slot) use ($data): void {
            $active = array_map(fn ($s) => $s->value,
                array_filter(BookingStatus::cases(), fn ($s) => $s->isActive()));
            if ($slot->booked_count > 0 || DB::table('bookings')->where('slot_id', $slot->id)
                ->whereIn('status', $active)->exists()) {
                throw new BkdException('Không thể sửa slot đang có lịch giữ chỗ hoặc đã tiếp nhận.');
            }
            if (CarbonImmutable::parse($slot->work_date->toDateString().' '.$slot->start_time)->lte(now())) {
                throw new BkdException('Không thể sửa slot đã bắt đầu.');
            }
            [$start, $end] = $this->times($data);
            $this->assertNoOverlap((int) $slot->owner_id, $data['work_date'], $start, $end, $slot->id);
            $slot->fill(['work_date' => $data['work_date'], 'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s')]);
        }, 'bkd.slot.updated');
    }

    public function block(User $actor, int $id): Slot
    {
        if ($actor->role !== 'admin') {
            throw new AuthorizationException;
        }

        return $this->change($actor, $id, function (Slot $slot): void {
            $slot->status = 'blocked';
        }, 'bkd.slot.blocked');
    }

    private function change(User $actor, int $id, callable $change, string $action): Slot
    {
        $original = Slot::query()->where('owner_type', 'doctor')->findOrFail($id);

        return DB::transaction(function () use ($actor, $original, $change, $action): Slot {
            $doctor = $this->doctor((int) $original->owner_id, true);
            if ($actor->role !== 'admin' && ($actor->role !== 'doctor' || (int) $doctor->user_id !== $actor->id)) {
                throw new AuthorizationException;
            }
            $slot = Slot::query()->where('owner_type', 'doctor')->lockForUpdate()->findOrFail($original->id);
            $change($slot);
            if ($slot->isDirty()) {
                $slot->save();
                $this->audit($actor, $slot, $action);
            }

            return $slot;
        }, 3);
    }

    private function doctor(int $id, bool $lock = false): object
    {
        $query = DB::table('doctors')->where('id', $id)->whereNull('deleted_at');
        if ($lock) {
            $query->lockForUpdate();
        }
        $doctor = $query->first();
        abort_if(! $doctor, 404);

        return $doctor;
    }

    private function times(array $data): array
    {
        $start = CarbonImmutable::parse($data['work_date'].' '.$data['start_time']);
        $end = $start->addMinutes(30);
        if ($start->lte(now()) || $end->toDateString() !== $start->toDateString()) {
            throw ValidationException::withMessages(['start_time' => 'Slot phải ở tương lai và đủ 30 phút trong cùng ngày.']);
        }

        return [$start, $end];
    }

    private function assertNoOverlap(int $doctorId, string $date, CarbonImmutable $start,
        CarbonImmutable $end, ?int $exceptId = null): void
    {
        $overlap = Slot::query()->where('owner_type', 'doctor')->where('owner_id', $doctorId)
            ->whereDate('work_date', $date)->when($exceptId, fn ($q) => $q->where('id', '<>', $exceptId))
            ->where('start_time', '<', $end->format('H:i:s'))
            ->where('end_time', '>', $start->format('H:i:s'))->exists();
        if ($overlap) {
            throw new SlotUnavailableException('Slot giao giờ với lịch bác sĩ đã công bố.');
        }
    }

    private function audit(User $actor, Slot $slot, string $action): void
    {
        DB::table('audit_logs')->insert([
            'actor_id' => $actor->id, 'actor_type' => 'user', 'action' => $action,
            'entity_type' => 'slot', 'entity_id' => $slot->id,
            'changes' => json_encode(['work_date' => $slot->work_date->toDateString(),
                'start_time' => $slot->start_time, 'end_time' => $slot->end_time,
                'status' => $slot->status], JSON_THROW_ON_ERROR),
            'occurred_at' => now(),
        ]);
    }
}
