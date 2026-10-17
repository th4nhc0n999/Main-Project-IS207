<?php

namespace App\Http\Resources;

use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'owner_type' => $this->owner_type,
            'owner_id' => $this->owner_id,
            'work_date' => $this->work_date instanceof CarbonInterface
                ? $this->work_date->toDateString()
                : $this->work_date,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'capacity' => (int) $this->capacity,
            'booked_count' => (int) $this->booked_count,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
