<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /** Sprint 4 deliberately has no voucher or client-supplied price. */
    public function calculate(int $examFee): array
    {
        $serviceFee = (int) config('medsi.service_fee_amount');
        if ($examFee < 0 || $serviceFee < 0 || $examFee > 999999999999 - $serviceFee) {
            throw ValidationException::withMessages(['exam_fee' => 'Phí khám không hợp lệ.']);
        }

        return ['exam_fee' => $examFee, 'discount_amount' => 0,
            'service_fee' => $serviceFee, 'total_amount' => $examFee + $serviceFee];
    }

    public function create(Booking $booking): object
    {
        return DB::transaction(function () use ($booking) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $existing = DB::table('payments')->where('booking_id', $booking->id)->first();
            if ($existing) {
                return $existing;
            }
            $fee = $booking->booking_type === 'doctor'
                ? DB::table('doctors')->where('id', $booking->doctor_id)->value('consultation_fee')
                : DB::table('exam_types')->where('id', $booking->exam_type_id)
                    ->where('hospital_id', $booking->hospital_id)->value('price');
            if ($fee === null) {
                throw ValidationException::withMessages(['booking_id' => 'Không tìm thấy phí khám.']);
            }
            $id = DB::table('payments')->insertGetId($this->calculate((int) $fee) + [
                'booking_id' => $booking->id, 'method' => null, 'status' => 'pending',
                'received_amount' => 0, 'refunded_amount' => 0,
                'created_at' => now(), 'updated_at' => now(),
            ]);

            return DB::table('payments')->find($id);
        });
    }
}
