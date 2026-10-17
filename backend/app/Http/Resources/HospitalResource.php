<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HospitalResource extends JsonResource
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
            'name' => $this->name,
            'code' => $this->code ?? null,
            'address' => $this->address,
            'city' => $this->city,
            'phone' => $this->phone ?? $this->hotline,
            'hotline' => $this->hotline,
            'email' => $this->email ?? null,
            'description' => $this->description,
            'avatar' => $this->avatar ?? $this->image,
            'image' => $this->image,
            'status' => $this->status ?? ($this->deleted_at ? 'inactive' : 'active'),
            'exam_types' => ExamTypeResource::collection($this->whenLoaded('examTypes')),
            'slots' => SlotResource::collection($this->whenLoaded('slots')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
