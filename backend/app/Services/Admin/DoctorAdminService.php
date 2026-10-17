<?php

namespace App\Services\Admin;

use App\Models\Doctor;
use Illuminate\Database\Eloquent\Collection;

class DoctorAdminService
{
    /**
     * Lấy danh sách bác sĩ, có thể lọc theo chuyên khoa.
     */
    public function list(?int $specialtyId = null): Collection
    {
        $query = Doctor::with('specialty');

        if ($specialtyId) {
            $query->where('specialty_id', $specialtyId);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Tạo bác sĩ mới.
     */
    public function create(array $data): Doctor
    {
        $doctor = Doctor::create($data);

        return $doctor->load('specialty');
    }

    /**
     * Cập nhật thông tin bác sĩ.
     */
    public function update(int $id, array $data): Doctor
    {
        $doctor = Doctor::findOrFail($id);
        $doctor->update($data);

        return $doctor->load('specialty');
    }

    /**
     * Xóa bác sĩ (soft delete).
     */
    public function delete(int $id): void
    {
        $doctor = Doctor::findOrFail($id);
        $doctor->delete();
    }

    /**
     * Lấy chi tiết 1 bác sĩ.
     */
    public function find(int $id): Doctor
    {
        return Doctor::with('specialty')->findOrFail($id);
    }
}
