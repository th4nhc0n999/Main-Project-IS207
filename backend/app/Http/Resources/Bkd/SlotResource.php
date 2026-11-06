<?php

namespace App\Http\Resources\Bkd;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $start = CarbonImmutable::parse($this->work_date->toDateString().' '.$this->start_time);

        return [
            'id' => $this->id,
            'doctor_id' => (int) $this->owner_id,
            'specialty_id' => (int) $this->specialty_id,
            'work_date' => $this->work_date->toDateString(),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'starts_at' => $start->toIso8601String(),
            'capacity' => $this->capacity,
            'booked_count' => $this->booked_count,
            'remaining_places' => max(0, $this->capacity - $this->booked_count),
            'status' => $this->status,
            'can_book' => $this->status === 'available' && $this->booked_count < $this->capacity
                && $start->gte(now()->addMinutes((int) config('medsi.min_lead_doctor_minutes')))
                && $start->lte(now()->addDays((int) config('medsi.max_advance_days'))),
        ];
    }
}
