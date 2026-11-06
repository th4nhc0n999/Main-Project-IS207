<?php

namespace App\Http\Resources\Bkd;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Deliberate allowlist: never serialize a model/profile or arbitrary snapshot.
        return [
            'id' => $this->id, 'code' => $this->code, 'booking_type' => $this->booking_type,
            'doctor_id' => (int) $this->doctor_id, 'patient_profile_id' => (int) $this->patient_profile_id,
            'slot_id' => (int) $this->slot_id, 'status' => $this->status->value,
            'version' => $this->version,
            'hold_expires_at' => $this->hold_expires_at?->toIso8601String(),
            'approval_expires_at' => $this->approval_expires_at?->toIso8601String(),
            'approval_seconds_remaining' => $this->approval_expires_at
                ? max(0, $this->approval_expires_at->getTimestamp() - now()->getTimestamp()) : null,
            'decided_at' => $this->decided_at?->toIso8601String(),
            'reject_reason' => $this->reject_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason_code' => $this->cancel_reason_code,
            'cancel_reason' => $this->cancel_reason,
            'patient' => ['full_name' => $this->patient_snapshot['full_name'] ?? null],
            'slot' => $this->when($this->relationLoaded('bkdSlot'), fn () => new SlotResource($this->getRelation('bkdSlot'))),
            'payment' => $this->when($this->relationLoaded('bkdPayment'), function () {
                $payment = $this->getRelation('bkdPayment');
                if (! $payment) {
                    return null;
                }

                return collect(['id', 'method', 'status', 'exam_fee', 'discount_amount', 'service_fee',
                    'total_amount', 'received_amount', 'refunded_amount'])->mapWithKeys(fn ($key) => [
                        $key => in_array($key, ['method', 'status'], true) ? $payment->$key
                            : (int) $payment->$key,
                    ])->all();
            }),
        ];
    }
}
