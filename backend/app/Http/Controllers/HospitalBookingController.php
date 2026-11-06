<?php

namespace App\Http\Controllers;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\Slot;
use App\Services\BookingReadService;
use App\Services\BookingStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HospitalBookingController extends Controller
{
    public function hospitals(): JsonResponse
    {
        return response()->json(['data' => DB::table('hospitals')->whereNull('deleted_at')
            ->orderBy('name')->get(['id', 'name', 'address', 'city'])]);
    }

    public function options(Request $request, int $hospital): JsonResponse
    {
        $record = $this->hospital($hospital);
        $exams = DB::table('exam_types')->where('hospital_id', $hospital)->whereNull('deleted_at')->orderBy('name')->get();
        $specialties = DB::table('specialties')->whereIn('id', DB::table('slots')->where('owner_type', 'hospital')->where('owner_id', $hospital)->select('specialty_id'))
            ->orderBy('name')->get(['id', 'code', 'name']);
        $profiles = DB::table('patient_profiles')->where('user_id', $request->user()->id)->whereNull('deleted_at')
            ->whereExists(fn ($query) => $query->selectRaw('1')->from('patient_consents')->whereColumn('patient_profile_id', 'patient_profiles.id')
                ->whereColumn('patient_consents.user_id', 'patient_profiles.user_id')->where('is_agreed', true)->whereNull('revoked_at'))
            ->orderByDesc('is_default')->get(['id', 'full_name', 'relationship']);

        return response()->json(['data' => [
            'hospital' => $record, 'exam_types' => $exams, 'specialties' => $specialties, 'profiles' => $profiles,
            'service_fee' => (int) config('medsi.service_fee_amount'),
        ]]);
    }

    public function slots(Request $request, int $hospital): JsonResponse
    {
        $this->hospital($hospital);
        $data = $request->validate([
            'specialty_id' => ['nullable', 'integer', 'exists:specialties,id'],
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $query = Slot::query()->where('owner_type', 'hospital')->where('owner_id', $hospital)
            ->where('status', 'available')->whereColumn('booked_count', '<', 'capacity')
            ->whereRaw("CONCAT(work_date, ' ', start_time) >= ?", [now()->addDays((int) config('medsi.min_lead_hospital_days'))->format('Y-m-d H:i:s')])
            ->whereRaw("CONCAT(work_date, ' ', start_time) <= ?", [now()->addDays((int) config('medsi.max_advance_days'))->format('Y-m-d H:i:s')]);
        if (isset($data['specialty_id'])) {
            $query->where('specialty_id', $data['specialty_id']);
        }
        if (isset($data['date'])) {
            $query->where('work_date', $data['date']);
        }

        return response()->json(['data' => $query->orderBy('work_date')->orderBy('start_time')->get()->map(fn (Slot $slot) => [
            'id' => $slot->id, 'specialty_id' => $slot->specialty_id,
            'work_date' => $slot->work_date->toDateString(), 'start_time' => $slot->start_time, 'end_time' => $slot->end_time,
            'capacity' => $slot->capacity, 'booked_count' => $slot->booked_count,
            'remaining_capacity' => $slot->capacity - $slot->booked_count,
        ])]);
    }

    public function createSlot(Request $request, int $hospital): JsonResponse
    {
        abort_unless($request->user()->role === 'admin', 403);
        $this->hospital($hospital);
        $data = $request->validate([
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'capacity' => ['required', 'integer', 'min:1', 'max:100000'],
        ]);
        // Serialize creation for a hospital; no new queue/counter table is needed.
        $slot = DB::transaction(function () use ($hospital, $data) {
            DB::table('hospitals')->where('id', $hospital)->lockForUpdate()->firstOrFail();
            $exists = Slot::query()->where('owner_type', 'hospital')->where('owner_id', $hospital)
                ->where('specialty_id', $data['specialty_id'])->where('work_date', $data['work_date'])
                ->where('start_time', $data['start_time'].':00')->exists();
            if ($exists) {
                throw ValidationException::withMessages(['start_time' => 'Ca khám đã tồn tại cho chuyên khoa này.']);
            }

            return Slot::query()->create([...$data, 'owner_type' => 'hospital', 'owner_id' => $hospital]);
        });

        return response()->json(['data' => $slot], 201);
    }

    public function store(Request $request, BookingStateMachine $stateMachine, BookingReadService $read): JsonResponse
    {
        abort_unless($request->user()->role === 'patient', 403);
        $data = $request->validate([
            'hospital_id' => ['required', 'integer', Rule::exists('hospitals', 'id')->whereNull('deleted_at')],
            'specialty_id' => ['required', 'integer', 'exists:specialties,id'],
            'exam_type_id' => ['required', 'integer'], 'slot_id' => ['required', 'integer', 'exists:slots,id'],
            'patient_profile_id' => ['required', 'integer'],
            'request_key' => ['required', 'string', 'max:64'],
            'symptoms' => ['nullable', 'string', 'max:'.config('medsi.symptoms_max_length')],
            'doctor_id' => ['prohibited'], 'user_id' => ['prohibited'], 'patient_snapshot' => ['prohibited'],
            'status' => ['prohibited'], 'total_amount' => ['prohibited'],
        ]);
        $slot = Slot::query()->findOrFail($data['slot_id']);
        if ((int) $slot->specialty_id !== (int) $data['specialty_id']) {
            throw ValidationException::withMessages(['specialty_id' => 'Chuyên khoa không khớp ca khám.']);
        }
        $booking = new Booking([
            'user_id' => $request->user()->id, 'booking_type' => 'hospital', 'doctor_id' => null,
            'hospital_id' => $data['hospital_id'], 'exam_type_id' => $data['exam_type_id'],
            'slot_id' => $slot->id, 'patient_profile_id' => $data['patient_profile_id'],
            'request_key' => $data['request_key'], 'symptoms' => $data['symptoms'] ?? null,
        ]);
        $booking = $stateMachine->apply($booking, BookingEvent::T01, $request->user(), ['ip_address' => $request->ip()]);

        return response()->json(['data' => $read->detail($request->user(), $booking->id)], $booking->wasRecentlyCreated ? 201 : 200);
    }

    private function hospital(int $id): object
    {
        return DB::table('hospitals')->where('id', $id)->whereNull('deleted_at')->firstOrFail();
    }
}
