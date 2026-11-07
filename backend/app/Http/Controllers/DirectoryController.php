<?php

namespace App\Http\Controllers;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\Doctor;
use App\Services\BookingReadService;
use App\Services\BookingStateMachine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DirectoryController extends Controller
{
    private function doctors()
    {
        return DB::table('doctors as d')->whereNull('d.deleted_at')
            ->join('specialties as s', 's.id', '=', 'd.specialty_id')
            ->leftJoin('hospitals as h', 'h.id', '=', 'd.hospital_id')
            ->select('d.id', 'd.name', 'd.title', 'd.bio', 'd.city', 'd.address', 'd.latitude', 'd.longitude',
                'd.consultation_fee', 'd.years_experience', 'd.specialty_id', 's.name as specialty', 'h.name as hospital');
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'lat' => 'required_with:lng|numeric|between:-90,90', 'lng' => 'required_with:lat|numeric|between:-180,180',
            'radius' => 'integer|in:2,5,10,20', 'specialty' => 'integer', 'city' => 'string|max:100', 'q' => 'string|max:150',
        ]);
        $doctors = $this->doctors();
        $hospitals = DB::table('hospitals')->whereNull('deleted_at')->select('id', 'name', 'city', 'address', 'latitude', 'longitude');
        $cities = (clone $hospitals)->pluck('city')->merge((clone $doctors)->pluck('d.city'))->unique()->sort()->values();
        if (isset($filters['specialty'])) {
            $doctors->where('d.specialty_id', $filters['specialty']);
            $hospitals->whereIn('id', DB::table('slots')->select('owner_id')->where('owner_type', 'hospital')->where('specialty_id', $filters['specialty']));
        }
        $rows = collect();
        foreach ([['doctor', $doctors, 'd.'], ['hospital', $hospitals, '']] as [$kind,$query,$prefix]) {
            if (isset($filters['city'])) {
                $query->where($prefix.'city', $filters['city']);
            }
            if (isset($filters['q'])) {
                $query->where($prefix.'name', 'like', '%'.$filters['q'].'%');
            }
            foreach ($query->orderBy($prefix.'name')->get() as $row) {
                $row->kind = $kind;
                if (isset($filters['lat'])) {
                    if ($row->latitude === null || $row->longitude === null) {
                        continue;
                    }
                    $a = sin(deg2rad($row->latitude - $filters['lat']) / 2) ** 2
                        + cos(deg2rad($filters['lat'])) * cos(deg2rad($row->latitude))
                        * sin(deg2rad($row->longitude - $filters['lng']) / 2) ** 2;
                    $row->km = 12742 * asin(sqrt(max(0, min(1, $a))));
                    if ($row->km > ($filters['radius'] ?? 5)) {
                        continue;
                    }
                }
                $rows->push($row);
            }
        }

        return response()->json(['data' => isset($filters['lat']) ? $rows->sortBy('km')->values() : $rows,
            'cities' => $cities, 'specialties' => DB::table('specialties')->orderBy('name')->get(['id', 'name'])]);
    }

    public function show(int $doctor)
    {
        $record = $this->doctors()->where('d.id', $doctor)->firstOrFail();
        $slots = DB::table('slots')->where('owner_type', 'doctor')->where('owner_id', $doctor)
            ->where('specialty_id', $record->specialty_id)->where('status', 'available')->whereColumn('booked_count', '<', 'capacity')
            ->whereRaw('TIMESTAMP(work_date,start_time) BETWEEN ? AND ?', [now()->addMinutes(config('medsi.min_lead_doctor_minutes')), now()->addDays(config('medsi.max_advance_days'))])
            ->orderBy('work_date')->orderBy('start_time')->get(['id', 'work_date', 'start_time', 'end_time']);

        return response()->json(['data' => $record, 'slots' => $slots]);
    }

    public function book(Request $request, Doctor $doctor, BookingStateMachine $machine)
    {
        abort_unless($request->user()->role === 'patient', 403);
        $fields = $request->validate(['slot_id' => 'required|integer|exists:slots,id', 'patient_profile_id' => 'required|integer',
            'request_key' => 'required|string|max:64']);
        $booking = new Booking($fields + ['user_id' => $request->user()->id, 'doctor_id' => $doctor->id, 'booking_type' => 'doctor']);
        $saved = $machine->apply($booking, BookingEvent::T01, $request->user(), ['ip_address' => $request->ip()]);

        return response()->json(['data' => ['id' => $saved->id]]);
    }

    public function appointments(Request $request)
    {
        $doctor = Doctor::where('user_id', $request->user()->id)->firstOrFail();
        $rows = Booking::query()->join('slots', 'slots.id', '=', 'bookings.slot_id')
            ->where('bookings.doctor_id', $doctor->id)->whereIn('bookings.status', ['pending_approval', 'confirmed', 'checked_in'])
            ->orderBy('slots.work_date')->orderBy('slots.start_time')
            ->get(['bookings.id', 'bookings.code', 'bookings.status', 'slots.work_date', 'slots.start_time']);

        return response()->json(['data' => $rows]);
    }

    public function transition(Request $request, Booking $booking, string $action, BookingStateMachine $machine)
    {
        abort_unless(Doctor::whereKey($booking->doctor_id)->where('user_id', $request->user()->id)->exists(), 403);
        $updated = $machine->apply($booking, $action === 'approve' ? BookingEvent::T05 : BookingEvent::T12, $request->user());

        return response()->json(['data' => ['status' => $updated->status]]);
    }

    public function detail(Request $request, int $booking, BookingReadService $read)
    {
        $detail = $read->detail($request->user(), $booking);
        $detail['refunds'] = DB::table('refunds')->where('payment_id', $detail['payment']['id'] ?? 0)
            ->orderByDesc('id')->get(['id', 'status', 'amount', 'requested_at', 'processed_at']);

        return response()->json(['data' => $detail]);
    }
}
