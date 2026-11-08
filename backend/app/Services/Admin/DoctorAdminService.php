<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Doctor;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class DoctorAdminService
{
    public function list(?int $specialtyId = null): Collection
    {
        $query = Doctor::with(['specialty', 'hospital', 'user']);

        if ($specialtyId) {
            $query->where('specialty_id', $specialtyId);
        }

        return $query->get();
    }

    public function find(int $id): Doctor
    {
        return Doctor::with(['specialty', 'hospital', 'user'])->findOrFail($id);
    }

    public function create(array $data): Doctor
    {
        return Doctor::create($data);
    }

    public function update(int $id, array $data): Doctor
    {
        $doctor = Doctor::findOrFail($id);
        $doctor->update($data);

        return $doctor;
    }

    public function delete(int $id): void
    {
        $doctor = Doctor::findOrFail($id);

        // Quy tắc BR-ADM-01: Chặn xóa nếu đang có lịch hẹn pending hoặc confirmed
        $hasActiveBookings = Booking::where('doctor_id', $doctor->id)
            ->whereIn('status', ['pending_payment', 'pending_approval', 'confirmed'])
            ->exists();

        if ($hasActiveBookings) {
            throw new InvalidArgumentException('Bác sĩ đang có lịch khám chưa hoàn tất, không thể xóa khỏi hệ thống!');
        }

        // Hỗ trợ soft delete theo schema
        $doctor->delete();
    }
}

