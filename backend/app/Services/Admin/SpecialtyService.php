<?php

namespace App\Services\Admin;

use App\Models\Specialty;

class SpecialtyService
{
    /**
     * Lấy danh sách tất cả chuyên khoa.
     */
    public function list()
    {
        return Specialty::withCount('doctors')
            ->orderBy('name')
            ->get();
    }

    /**
     * Tạo chuyên khoa mới.
     */
    public function create(array $data): Specialty
    {
        return Specialty::create($data);
    }

    /**
     * Cập nhật chuyên khoa.
     */
    public function update(int $id, array $data): Specialty
    {
        $specialty = Specialty::findOrFail($id);
        $specialty->update($data);

        return $specialty;
    }

    /**
     * Xóa chuyên khoa.
     * Kiểm tra nếu còn bác sĩ thuộc chuyên khoa thì không cho xóa.
     */
    public function delete(int $id): void
    {
        $specialty = Specialty::withCount('doctors')->findOrFail($id);

        if ($specialty->doctors_count > 0) {
            throw new \Exception("Không thể xóa chuyên khoa đang có {$specialty->doctors_count} bác sĩ.");
        }

        $specialty->delete();
    }

    /**
     * Lấy chi tiết 1 chuyên khoa.
     */
    public function find(int $id): Specialty
    {
        return Specialty::withCount('doctors')->findOrFail($id);
    }
}
