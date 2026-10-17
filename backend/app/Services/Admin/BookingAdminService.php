<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BookingAdminService
{
    /**
     * Lấy danh sách lịch hẹn, có thể lọc theo nhiều tiêu chí.
     *
     * @param array $filters [status, booking_type, doctor_id, hospital_id, from_date, to_date]
     * @return Collection
     */
    public function list(array $filters = []): Collection
    {
        $query = Booking::with([
            'user',
            'patientProfile',
            'doctor.specialty',
            'hospital',
            'slot',
        ]);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['booking_type'])) {
            $query->where('booking_type', $filters['booking_type']);
        }

        if (!empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        if (!empty($filters['hospital_id'])) {
            $query->where('hospital_id', $filters['hospital_id']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    /**
     * Lấy chi tiết 1 booking.
     */
    public function find(int $id): Booking
    {
        return Booking::with([
            'user',
            'patientProfile',
            'doctor.specialty',
            'hospital',
            'examType',
            'slot',
            'payment',
        ])->findOrFail($id);
    }

    /**
     * Cập nhật trạng thái booking (Admin duyệt / từ chối / hoàn thành).
     *
     * @param int    $id
     * @param string $status (confirmed|rejected|cancelled|completed)
     * @param string|null $note
     * @return Booking
     */
    public function updateStatus(int $id, string $status, ?string $note = null): Booking
    {
        $allowed = ['confirmed', 'rejected', 'cancelled', 'completed'];
        if (!in_array($status, $allowed)) {
            throw new Exception("Trạng thái '{$status}' không hợp lệ. Chỉ chấp nhận: " . implode(', ', $allowed) . '.');
        }

        return DB::transaction(function () use ($id, $status, $note) {
            $booking = Booking::with('slot')->findOrFail($id);
            $oldStatus = $booking->status;

            // Kiểm tra luồng chuyển trạng thái hợp lệ
            $validTransitions = [
                'pending'         => ['confirmed', 'rejected', 'cancelled'],
                'pending_payment' => ['confirmed', 'rejected', 'cancelled'],
                'confirmed'       => ['completed', 'cancelled'],
            ];

            $allowedFromCurrent = $validTransitions[$oldStatus] ?? [];
            if (!in_array($status, $allowedFromCurrent)) {
                throw new Exception("Không thể chuyển từ '{$oldStatus}' sang '{$status}'.");
            }

            $booking->status = $status;
            if ($note !== null) {
                $booking->note = $note;
            }
            $booking->save();

            // Cập nhật booked_count trên slot nếu hủy/từ chối
            if (in_array($status, ['rejected', 'cancelled']) && $booking->slot) {
                $slot = $booking->slot;
                if ($slot->booked_count > 0) {
                    $slot->booked_count -= 1;
                    // Mở lại slot nếu vừa giảm từ full
                    if ($slot->status === 'full') {
                        $slot->status = 'available';
                    }
                    $slot->save();
                }
            }

            return $booking->load([
                'user',
                'patientProfile',
                'doctor.specialty',
                'hospital',
                'slot',
            ]);
        });
    }

    /**
     * Thống kê tổng quan cho Dashboard Admin.
     */
    public function getDashboardStats(): array
    {
        return [
            'total_bookings'     => Booking::count(),
            'pending_bookings'   => Booking::where('status', 'pending')->count(),
            'confirmed_bookings' => Booking::where('status', 'confirmed')->count(),
            'completed_bookings' => Booking::where('status', 'completed')->count(),
            'cancelled_bookings' => Booking::whereIn('status', ['cancelled', 'rejected'])->count(),
            'total_users'        => User::count(),
            'total_patients'     => User::where('role', 'patient')->count(),
        ];
    }
}
