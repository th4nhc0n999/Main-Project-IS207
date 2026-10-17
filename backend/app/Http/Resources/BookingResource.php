<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
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
            'code' => $this->code,
            'booking_type' => $this->booking_type,
            'status' => $this->status,
            'symptoms' => $this->symptoms,
            'note' => $this->note,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'patient_profile' => $this->whenLoaded('patientProfile'),
            'patientProfile' => $this->whenLoaded('patientProfile'),
            'doctor' => DoctorResource::make($this->whenLoaded('doctor')),
            'slot' => $this->whenLoaded('slot'),
            'hospital' => $this->whenLoaded('hospital'),
            'exam_type' => $this->whenLoaded('examType'),
            'examType' => $this->whenLoaded('examType'),
            'payment' => $this->whenLoaded('payment'),
        ];
    }
}
