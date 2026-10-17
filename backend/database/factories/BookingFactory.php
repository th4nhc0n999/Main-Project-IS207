<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        $doctor = Doctor::factory()->create();

        return [
            'user_id' => User::factory(),
            'patient_profile_id' => PatientProfile::factory(),
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'hospital_id' => null,
            'exam_type_id' => null,
            'slot_id' => Slot::factory()->forDoctor($doctor),
            'symptoms' => fake()->randomElement([
                'Dau dau, met moi.',
                'Ho va sot nhe.',
                'Can tu van suc khoe dinh ky.',
            ]),
            'status' => 'pending',
            'slot_hold_expires_at' => null,
            'note' => fake()->optional()->randomElement([
                'Vui long goi truoc khi den.',
                'Can ho tro cho tre em.',
            ]),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Booking $booking) {
            if (! $booking->code) {
                $booking->code = 'BK'.now()->format('Ymd').fake()->numerify('#####');
            }
        });
    }

    public function forDoctorBooking(): static
    {
        $doctor = Doctor::factory()->create();

        return $this->state(fn (array $attributes) => [
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'hospital_id' => null,
            'exam_type_id' => null,
            'slot_id' => Slot::factory()->forDoctor($doctor),
        ]);
    }

    public function forHospitalBooking(): static
    {
        $hospital = Hospital::factory()->create();
        $examType = ExamType::factory()->for($hospital)->create();

        return $this->state(fn (array $attributes) => [
            'booking_type' => 'hospital',
            'doctor_id' => null,
            'hospital_id' => $hospital->id,
            'exam_type_id' => $examType->id,
            'slot_id' => Slot::factory()->forHospital($hospital),
        ]);
    }

    public function pendingPayment(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_payment',
            'slot_hold_expires_at' => now()->addMinutes(15),
        ]);
    }

    public function expiredHold(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_payment',
            'slot_hold_expires_at' => now()->subMinutes(5),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'cancelled']);
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'confirmed']);
    }
}
