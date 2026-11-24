<?php

namespace App\Services\Admin;

use App\Models\Slot;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SlotService
{
    public function list(array $filters = []): Collection
    {
        $query = Slot::query();

        if (! empty($filters['owner_type'])) {
            $query->where('owner_type', $filters['owner_type']);
        }
        if (! empty($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }
        if (! empty($filters['work_date'])) {
            $query->whereDate('work_date', $filters['work_date']);
        }
        if (! empty($filters['from_date'])) {
            $query->whereDate('work_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $query->whereDate('work_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('work_date')->orderBy('start_time')->get();
    }

    public function find(int $id): Slot
    {
        return Slot::findOrFail($id);
    }

    public function create(array $data): Slot
    {
        $data['capacity'] = $data['capacity'] ?? 1;
        $data['booked_count'] = 0;
        $data['status'] = $data['status'] ?? 'available';

        return Slot::create($data);
    }

    public function createBatch(array $payload): Collection
    {
        $slots = collect();
        $items = $payload['slots'] ?? $payload;

        DB::transaction(function () use ($items, &$slots) {
            foreach ($items as $item) {
                if (is_array($item)) {
                    $slots->push($this->create($item));
                }
            }
        });

        return $slots;
    }

    public function update(int $id, array $data): Slot
    {
        $slot = Slot::findOrFail($id);
        $slot->update($data);

        return $slot;
    }

    public function delete(int $id): void
    {
        $slot = Slot::findOrFail($id);
        if ($slot->booked_count > 0) {
            throw new InvalidArgumentException('Không thể xóa khung giờ đã có người đặt.');
        }
        $slot->delete();
    }

    public function toggleBlock(int $id): Slot
    {
        $slot = Slot::findOrFail($id);
        $slot->status = $slot->status === 'blocked' ? 'available' : 'blocked';
        $slot->save();

        return $slot;
    }
}
