<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'code' => 'BK' . strtoupper(Str::random(10)),
            'user_id' => User::factory(),
            'patient_profile_id' => PatientProfile::factory(),
            'booking_type' => 'doctor',
            'doctor_id' => Doctor::factory(),
            'hospital_id' => null,
            'exam_type_id' => null,
            'slot_id' => Slot::factory(),
            'symptoms' => fake()->sentence(),
            'patient_snapshot' => [
                'full_name' => fake()->name(),
                'dob' => '1995-05-15',
                'gender' => 'male',
                'phone' => '090*****89',
                'identity_card_number' => '001099****12',
                'relationship' => 'Bản thân',
            ],
            'status' => BookingStatus::PENDING_PAYMENT,
            'hold_expires_at' => now()->addMinutes(15),
            'approval_expires_at' => null,
            'decided_by' => null,
            'decided_at' => null,
            'reject_reason' => null,
            'cancelled_at' => null,
            'cancelled_by' => null,
            'cancel_reason_code' => null,
            'cancel_reason' => null,
            'request_key' => Str::random(32),
            'version' => 1,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => BookingStatus::CONFIRMED,
            'hold_expires_at' => null,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => BookingStatus::COMPLETED,
            'hold_expires_at' => null,
        ]);
    }
}
