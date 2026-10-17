<?php

namespace App\Services;

use App\Exceptions\Hospital\HospitalNotFoundException;
use App\Models\Hospital;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HospitalService
{
    /**
     * Tìm kiếm và lọc danh sách bệnh viện theo từ khóa hoặc thành phố (đồng nhất pattern với M4).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator
     */
    public function search(array $filters = []): LengthAwarePaginator
    {
        $query = Hospital::query()->with('examTypes');

        $keyword = $filters['keyword'] ?? $filters['q'] ?? null;
        if (! empty($keyword)) {
            $query->search($keyword);
        }

        $city = $filters['city'] ?? null;
        if (! empty($city)) {
            $query->inCity($city);
        }

        $perPage = (int) ($filters['per_page'] ?? 10);

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Lấy thông tin chi tiết của bệnh viện kèm các loại dịch vụ khám và khung giờ trống khả dụng.
     *
     * @param  int  $id
     * @return Hospital
     *
     * @throws HospitalNotFoundException
     */
    public function getDetail(int $id): Hospital
    {
        $hospital = Hospital::with([
            'examTypes',
            'slots' => function ($query) {
                $query->where('status', 'available')
                      ->whereColumn('booked_count', '<', 'capacity')
                      ->where(function ($query) {
                          $query->whereDate('work_date', '>', today())
                              ->orWhere(function ($query) {
                                  $query->whereDate('work_date', today())
                                      ->where('start_time', '>', now()->format('H:i:s'));
                              });
                      })
                      ->orderBy('work_date')
                      ->orderBy('start_time');
            },
        ])->find($id);

        if (! $hospital) {
            throw new HospitalNotFoundException();
        }

        return $hospital;
    }
}
