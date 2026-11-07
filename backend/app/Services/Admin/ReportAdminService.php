<?php

namespace App\Services\Admin;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Specialty;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportAdminService
{
    /**
     * Báo cáo 1: Số lượng và tỷ lệ lịch khám phân bổ theo 9 trạng thái chuẩn (RPT-ADM-01 / DL-20)
     */
    public function getBookingStatusReport(?string $fromDate = null, ?string $toDate = null): array
    {
        $allStatuses = [
            'pending_payment' => 'Chờ thanh toán',
            'pending_approval' => 'Chờ bác sĩ duyệt',
            'confirmed' => 'Đã xác nhận / Chờ khám',
            'checked_in' => 'Đã tiếp nhận (Check-in)',
            'completed' => 'Khám hoàn thành',
            'cancelled' => 'Đã hủy',
            'expired' => 'Hết hạn giữ chỗ/duyệt',
            'rejected' => 'Bác sĩ từ chối',
            'no_show' => 'Vắng mặt không đến',
        ];

        $query = Booking::query();

        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $rawCounts = $query->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $totalBookings = array_sum($rawCounts);

        $details = [];
        foreach ($allStatuses as $statusKey => $statusLabel) {
            $count = $rawCounts[$statusKey] ?? 0;
            $percent = $totalBookings > 0 ? round(($count / $totalBookings) * 100, 2) : 0;

            $details[] = [
                'status' => $statusKey,
                'label' => $statusLabel,
                'count' => $count,
                'percentage' => $percent,
            ];
        }

        return [
            'total_bookings' => $totalBookings,
            'details' => $details,
        ];
    }

    /**
     * Báo cáo 2: Doanh thu ròng theo quyết định DL-25 / CF-53
     * Doanh thu ròng (Net Revenue) = Tổng tiền thu thành công (received_amount) - Tổng tiền hoàn thành công (succeeded).
     */
    public function getNetRevenueReport(?string $fromDate = null, ?string $toDate = null): array
    {
        // 1. Tổng tiền thu thành công
        $paymentQuery = Payment::whereIn('status', ['paid', 'refunded']);
        if ($fromDate) {
            $paymentQuery->whereDate('paid_at', '>=', $fromDate);
        }
        if ($toDate) {
            $paymentQuery->whereDate('paid_at', '<=', $toDate);
        }

        $grossRevenue = (float) $paymentQuery->sum('received_amount');
        $totalPaidCount = (int) $paymentQuery->count();

        // 2. Tổng tiền hoàn thành công
        $refundQuery = Refund::where('status', 'succeeded');
        if ($fromDate) {
            $refundQuery->whereDate('processed_at', '>=', $fromDate);
        }
        if ($toDate) {
            $refundQuery->whereDate('processed_at', '<=', $toDate);
        }

        $totalRefunded = (float) $refundQuery->sum('amount');
        $totalRefundCount = (int) $refundQuery->count();

        // 3. Doanh thu ròng
        $netRevenue = $grossRevenue - $totalRefunded;

        return [
            'gross_revenue' => $grossRevenue,
            'total_paid_count' => $totalPaidCount,
            'total_refunded' => $totalRefunded,
            'total_refund_count' => $totalRefundCount,
            'net_revenue' => $netRevenue,
        ];
    }

    /**
     * Báo cáo 3: Tỷ lệ hủy theo nguyên nhân (RPT-ADM-03)
     */
    public function getCancellationRateReport(?string $fromDate = null, ?string $toDate = null): array
    {
        $baseQuery = Booking::query();
        if ($fromDate) {
            $baseQuery->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $baseQuery->whereDate('created_at', '<=', $toDate);
        }

        $totalBookings = (int) (clone $baseQuery)->count();
        $totalCancelled = (int) (clone $baseQuery)->where('status', 'cancelled')->count();
        $cancellationRate = $totalBookings > 0 ? round(($totalCancelled / $totalBookings) * 100, 2) : 0;

        // Thống kê phân bổ theo cancel_reason_code
        $reasonCounts = (clone $baseQuery)->where('status', 'cancelled')
            ->select('cancel_reason_code', DB::raw('COUNT(*) as total'))
            ->groupBy('cancel_reason_code')
            ->pluck('total', 'cancel_reason_code')
            ->toArray();

        $byReason = [];
        foreach ($reasonCounts as $code => $count) {
            $reasonKey = $code ?: 'unspecified';
            $byReason[] = [
                'reason_code' => $reasonKey,
                'count' => $count,
                'percentage_of_cancelled' => $totalCancelled > 0 ? round(($count / $totalCancelled) * 100, 2) : 0,
            ];
        }

        return [
            'total_bookings' => $totalBookings,
            'total_cancelled' => $totalCancelled,
            'cancellation_rate' => $cancellationRate,
            'by_reason' => $byReason,
        ];
    }

    /**
     * Báo cáo 4: Top Bác sĩ & Chuyên khoa được đặt nhiều nhất (RPT-ADM-04)
     */
    public function getTopBookedReport(int $limit = 5): array
    {
        // 1. Top Bác sĩ
        $topDoctors = Booking::whereNotNull('doctor_id')
            ->select('doctor_id', DB::raw('COUNT(*) as booking_count'))
            ->groupBy('doctor_id')
            ->orderByDesc('booking_count')
            ->limit($limit)
            ->with('doctor.specialty')
            ->get()
            ->map(function ($item) {
                return [
                    'doctor_id' => $item->doctor_id,
                    'doctor_name' => $item->doctor ? $item->doctor->name : 'N/A',
                    'title' => $item->doctor ? $item->doctor->title : null,
                    'specialty_name' => ($item->doctor && $item->doctor->specialty) ? $item->doctor->specialty->name : null,
                    'booking_count' => (int) $item->booking_count,
                ];
            });

        // 2. Top Chuyên khoa (thông qua slot.specialty_id)
        $topSpecialties = DB::table('bookings')
            ->join('slots', 'bookings.slot_id', '=', 'slots.id')
            ->join('specialties', 'slots.specialty_id', '=', 'specialties.id')
            ->select('specialties.id', 'specialties.name', 'specialties.code', DB::raw('COUNT(bookings.id) as booking_count'))
            ->groupBy('specialties.id', 'specialties.name', 'specialties.code')
            ->orderByDesc('booking_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'specialty_id' => $item->id,
                    'specialty_code' => $item->code,
                    'specialty_name' => $item->name,
                    'booking_count' => (int) $item->booking_count,
                ];
            });

        return [
            'top_doctors' => $topDoctors,
            'top_specialties' => $topSpecialties,
        ];
    }
}

