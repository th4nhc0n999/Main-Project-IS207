<?php

namespace App\Services\Admin;

use App\Models\Specialty;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SpecialtyService
{
    public function list(): Collection
    {
        return Specialty::withCount('doctors')->get();
    }

    public function find(int $id): Specialty
    {
        return Specialty::with('doctors')->findOrFail($id);
    }

    public function create(array $data): Specialty
    {
        if (empty($data['slug']) && ! empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        return Specialty::create($data);
    }

    public function update(int $id, array $data): Specialty
    {
        $specialty = Specialty::findOrFail($id);

        if (empty($data['slug']) && ! empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $specialty->update($data);

        return $specialty;
    }

    public function delete(int $id): void
    {
        $specialty = Specialty::findOrFail($id);

        // Chặn xóa nếu còn bác sĩ đang hoạt động
        if ($specialty->doctors()->count() > 0) {
            throw new InvalidArgumentException('Chuyên khoa đang có bác sĩ hoạt động, không thể xóa!');
        }

        // Chặn xóa nếu còn slot hoặc lịch hẹn
        if ($specialty->slots()->count() > 0) {
            throw new InvalidArgumentException('Chuyên khoa đang có ca khám liên kết, không thể xóa!');
        }

        $specialty->delete();
    }
}

