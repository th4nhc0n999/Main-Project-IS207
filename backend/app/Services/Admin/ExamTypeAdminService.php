<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\ExamType;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class ExamTypeAdminService
{
    public function list(?int $hospitalId = null): Collection
    {
        $query = ExamType::with(['hospital', 'specialty']);

        if ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        }

        return $query->get();
    }

    public function find(int $id): ExamType
    {
        return ExamType::with(['hospital', 'specialty'])->findOrFail($id);
    }

    public function create(array $data): ExamType
    {
        return ExamType::create($data);
    }

    public function update(int $id, array $data): ExamType
    {
        $examType = ExamType::findOrFail($id);
        $examType->update($data);

        return $examType;
    }

    public function delete(int $id): void
    {
        $examType = ExamType::findOrFail($id);

        // Chặn xóa nếu đang có lịch đặt khám theo loại khám này chưa hoàn tất
        $hasActiveBookings = Booking::where('exam_type_id', $examType->id)
            ->whereIn('status', ['pending_payment', 'pending_approval', 'confirmed'])
            ->exists();

        if ($hasActiveBookings) {
            throw new InvalidArgumentException('Loại khám đang có lịch đặt chưa hoàn tất, không thể xóa!');
        }

        // Hỗ trợ soft delete
        $examType->delete();
    }
}

