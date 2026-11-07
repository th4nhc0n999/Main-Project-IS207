<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class BookingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the booking.
     */
    public function view(User $user, Booking $booking): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'patient') {
            return (int) $booking->user_id === (int) $user->id;
        }

        if ($user->role === 'doctor') {
            return $this->doctorOwnsBooking($booking, $user);
        }

        if ($user->role === 'staff') {
            return $this->staffBelongsToBookingHospital($booking, $user);
        }

        return false;
    }

    /**
     * Determine whether the user can perform check-in on the booking.
     * Only assigned staff or admin.
     */
    public function checkIn(User $user, Booking $booking): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'staff') {
            return $this->staffBelongsToBookingHospital($booking, $user);
        }

        return false;
    }

    /**
     * Determine whether the user can cancel the booking.
     * - Admin: always allowed (can cancel even under 24h).
     * - Patient: only allowed when more than 24h before slot start.
     * - Doctor: only allowed for their own booking when emergency leave.
     * - Staff: strictly NO permission.
     */
    public function cancel(User $user, Booking $booking): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'staff') {
            return false; // Staff strictly cannot cancel bookings
        }

        if ($user->role === 'doctor') {
            return $this->doctorOwnsBooking($booking, $user);
        }

        if ($user->role === 'patient') {
            if ((int) $booking->user_id !== (int) $user->id) {
                return false;
            }

            // Check >= 24h before slot start
            $slot = Slot::find($booking->slot_id);
            if (! $slot) {
                return false;
            }

            $slotStart = CarbonImmutable::parse($slot->work_date->toDateString().' '.$slot->start_time);
            $cutoff = $slotStart->subHours((int) config('medsi.free_cancel_hours', 24));

            return now()->lte($cutoff);
        }

        return false;
    }

    /**
     * Determine whether the user can mark the booking completed.
     * Only doctor (for their own booking) or admin.
     */
    public function complete(User $user, Booking $booking): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorOwnsBooking($booking, $user);
        }

        return false;
    }

    /**
     * Helper to verify if doctor owns booking.
     */
    public function doctorOwnsBooking(Booking $booking, User $user): bool
    {
        if ($booking->doctor_id === null) {
            return false;
        }

        return DB::table('doctors')
            ->where('id', $booking->doctor_id)
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->exists();
    }

    /**
     * Helper to verify if staff belongs to the hospital of the booking.
     */
    public function staffBelongsToBookingHospital(Booking $booking, User $user): bool
    {
        if (empty($user->hospital_id)) {
            return false;
        }

        $hospitalId = $booking->hospital_id;

        if ($hospitalId === null && $booking->doctor_id !== null) {
            $hospitalId = DB::table('doctors')->where('id', $booking->doctor_id)->value('hospital_id');
        }

        return $hospitalId !== null && (int) $user->hospital_id === (int) $hospitalId;
    }
}

