<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Hospital;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class HospitalAdminService
{
    public function list(?string $city = null): Collection
    {
        $query = Hospital::withCount(['doctors', 'examTypes']);

        if ($city) {
            $query->where('city', $city);
        }

        return $query->get();
    }

    public function find(int $id): Hospital
    {
        return Hospital::with(['doctors', 'examTypes', 'staffUsers'])->findOrFail($id);
    }

    public function create(array $data): Hospital
    {
        return Hospital::create($data);
    }

    public function update(int $id, array $data): Hospital
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->update($data);

        return $hospital;
    }

    public function delete(int $id): void
    {
        $hospital = Hospital::findOrFail($id);

        // Chặn xóa nếu có lịch hẹn bệnh viện đang hoạt động
        $hasActiveBookings = Booking::where('hospital_id', $hospital->id)
            ->whereIn('status', ['pending_payment', 'pending_approval', 'confirmed'])
            ->exists();

        if ($hasActiveBookings) {
            throw new InvalidArgumentException('Bệnh viện đang có lịch khám chưa hoàn tất, không thể xóa!');
        }

        // Hỗ trợ soft delete
        $hospital->delete();
    }
}

