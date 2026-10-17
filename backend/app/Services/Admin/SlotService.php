<?php

namespace App\Services\Admin;

use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\Slot;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SlotService
{
    /**
     * Lấy danh sách khung giờ khám với các bộ lọc.
     *
     * @param array $filters [owner_type, owner_id, work_date, from_date, to_date, status]
     * @return Collection
     */
    public function list(array $filters = []): Collection
    {
        $query = Slot::with('owner');

        if (!empty($filters['owner_type'])) {
            $query->where('owner_type', $filters['owner_type']);
        }

        if (!empty($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (!empty($filters['work_date'])) {
            $query->whereDate('work_date', $filters['work_date']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('work_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('work_date', '<=', $filters['to_date']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('work_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Lấy chi tiết 1 khung giờ khám.
     */
    public function find(int $id): Slot
    {
        return Slot::with(['owner', 'bookings.user', 'bookings.patientProfile'])->findOrFail($id);
    }

    /**
     * Tạo 1 khung giờ khám mới (cho Bác sĩ hoặc Bệnh viện).
     */
    public function create(array $data): Slot
    {
        $this->validateOwner($data['owner_type'], (int) $data['owner_id']);

        // Kiểm tra trùng lặp theo unique key [owner_type, owner_id, work_date, start_time]
        $exists = Slot::where('owner_type', $data['owner_type'])
            ->where('owner_id', $data['owner_id'])
            ->whereDate('work_date', $data['work_date'])
            ->where('start_time', $data['start_time'])
            ->exists();

        if ($exists) {
            $ownerLabel = $data['owner_type'] === 'doctor' ? 'Bác sĩ' : 'Bệnh viện';
            throw new Exception("{$ownerLabel} này đã có khung giờ khám bắt đầu lúc {$data['start_time']} ngày {$data['work_date']}.");
        }

        $slot = Slot::create([
            'owner_type'   => $data['owner_type'],
            'owner_id'     => $data['owner_id'],
            'work_date'    => $data['work_date'],
            'start_time'   => $data['start_time'],
            'end_time'     => $data['end_time'],
            'capacity'     => $data['capacity'] ?? 1,
            'booked_count' => 0,
            'status'       => $data['status'] ?? 'available',
        ]);

        return $slot->load('owner');
    }

    /**
     * Tạo hàng loạt khung giờ khám trong ngày cho Bác sĩ hoặc Bệnh viện.
     *
     * @param array $data [
     *     'owner_type' => 'doctor'|'hospital',
     *     'owner_id'   => int,
     *     'work_date'  => string (Y-m-d),
     *     'capacity'   => int (optional),
     *     'time_slots' => array of ['start_time' => string, 'end_time' => string, 'capacity' => ?int]
     * ]
     * @return Collection
     */
    public function createBatch(array $data): Collection
    {
        $this->validateOwner($data['owner_type'], (int) $data['owner_id']);

        return DB::transaction(function () use ($data) {
            $createdSlots = new Collection();
            $defaultCapacity = $data['capacity'] ?? 1;

            foreach ($data['time_slots'] as $timeSlot) {
                // Bỏ qua nếu đã tồn tại khung giờ này
                $exists = Slot::where('owner_type', $data['owner_type'])
                    ->where('owner_id', $data['owner_id'])
                    ->whereDate('work_date', $data['work_date'])
                    ->where('start_time', $timeSlot['start_time'])
                    ->exists();

                if ($exists) {
                    continue;
                }

                $slot = Slot::create([
                    'owner_type'   => $data['owner_type'],
                    'owner_id'     => $data['owner_id'],
                    'work_date'    => $data['work_date'],
                    'start_time'   => $timeSlot['start_time'],
                    'end_time'     => $timeSlot['end_time'],
                    'capacity'     => $timeSlot['capacity'] ?? $defaultCapacity,
                    'booked_count' => 0,
                    'status'       => 'available',
                ]);

                $createdSlots->push($slot);
            }

            return $createdSlots->load('owner');
        });
    }

    /**
     * Cập nhật thông tin khung giờ khám.
     */
    public function update(int $id, array $data): Slot
    {
        $slot = Slot::findOrFail($id);

        $ownerType = $data['owner_type'] ?? $slot->owner_type;
        $ownerId = $data['owner_id'] ?? $slot->owner_id;

        // Nếu thay đổi owner thì xác thực lại
        if (isset($data['owner_type']) || isset($data['owner_id'])) {
            $this->validateOwner($ownerType, (int) $ownerId);
        }

        // Không cho phép giảm sức chứa nhỏ hơn số lượng đã đặt
        if (isset($data['capacity']) && $data['capacity'] < $slot->booked_count) {
            throw new Exception("Sức chứa không thể nhỏ hơn số lượt khám đã đặt ({$slot->booked_count}).");
        }

        $workDate = $data['work_date'] ?? (is_string($slot->work_date) ? $slot->work_date : $slot->work_date?->format('Y-m-d'));
        $startTime = $data['start_time'] ?? $slot->start_time;

        // Kiểm tra trùng lặp nếu đổi ngày, giờ hoặc chủ sở hữu
        $duplicate = Slot::where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->whereDate('work_date', $workDate)
            ->where('start_time', $startTime)
            ->where('id', '!=', $slot->id)
            ->exists();

        if ($duplicate) {
            $ownerLabel = $ownerType === 'doctor' ? 'Bác sĩ' : 'Bệnh viện';
            throw new Exception("{$ownerLabel} này đã có khung giờ khám bắt đầu lúc {$startTime} ngày {$workDate}.");
        }

        // Tự động điều chỉnh status nếu sức chứa đầy/trống
        if (isset($data['capacity'])) {
            if ($slot->booked_count >= $data['capacity'] && (!isset($data['status']) || $data['status'] === 'available')) {
                $data['status'] = 'full';
            } elseif ($slot->booked_count < $data['capacity'] && ($slot->status === 'full' && (!isset($data['status']) || $data['status'] === 'full'))) {
                $data['status'] = 'available';
            }
        }

        $slot->update($data);

        return $slot->load('owner');
    }

    /**
     * Xóa khung giờ khám.
     * Không cho phép xóa nếu có lịch hẹn ở trạng thái pending hoặc confirmed.
     */
    public function delete(int $id): void
    {
        $slot = Slot::findOrFail($id);

        $hasActiveBookings = $slot->bookings()
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($hasActiveBookings) {
            throw new Exception("Không thể xóa khung giờ đang có bệnh nhân đặt khám. Hãy đổi trạng thái sang 'blocked' hoặc hủy các lịch hẹn liên quan trước.");
        }

        $slot->delete();
    }

    /**
     * Chặn hoặc mở khóa khung giờ khám.
     */
    public function toggleBlock(int $id): Slot
    {
        $slot = Slot::findOrFail($id);

        if ($slot->status === 'blocked') {
            $slot->status = $slot->booked_count >= $slot->capacity ? 'full' : 'available';
        } else {
            $slot->status = 'blocked';
        }

        $slot->save();

        return $slot->load('owner');
    }

    /**
     * Xác thực chủ sở hữu (bác sĩ hoặc bệnh viện) có tồn tại.
     */
    protected function validateOwner(string $ownerType, int $ownerId): void
    {
        if ($ownerType === 'doctor') {
            $exists = Doctor::where('id', $ownerId)->exists();
            if (!$exists) {
                throw new Exception("Không tìm thấy bác sĩ với ID {$ownerId}.");
            }
        } elseif ($ownerType === 'hospital') {
            $exists = Hospital::where('id', $ownerId)->exists();
            if (!$exists) {
                throw new Exception("Không tìm thấy bệnh viện với ID {$ownerId}.");
            }
        } else {
            throw new Exception("Loại chủ sở hữu '{$ownerType}' không hợp lệ. Chỉ chấp nhận 'doctor' hoặc 'hospital'.");
        }
    }
}
