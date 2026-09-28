<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'booking_id' => $this->booking_id,
            'booking_code' => $this->booking?->code,
            'method' => [
                'code' => $this->method->value,
                'name' => $this->method->label(),
                'description' => $this->method->description(),
            ],
            'exam_fee' => (int) $this->exam_fee,
            'service_fee' => (int) $this->service_fee,
            'total_amount' => (int) $this->total_amount,
            'status' => [
                'code' => $this->status->value,
                'label' => $this->status->label(),
                'badge_color' => $this->status->badgeColor(),
            ],
            'transaction_code' => $this->transaction_code,
            'paid_at' => $this->paid_at?->format('d/m/Y H:i:s'),
            'hospital' => [
                'name' => $this->booking?->hospital?->name,
                'address' => $this->booking?->hospital?->address,
                'hotline' => $this->booking?->hospital?->hotline,
            ],
            'patient' => [
                'full_name' => $this->booking?->patientProfile?->full_name,
                'phone' => $this->booking?->patientProfile?->phone,
            ],
            'exam_type' => $this->booking?->examType?->name,
            'created_at' => $this->created_at?->format('d/m/Y H:i:s'),
        ];
    }
}
