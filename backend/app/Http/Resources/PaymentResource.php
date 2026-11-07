<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Explicit allowlist: never expose patient data or raw gateway payloads.
        $result = [];
        foreach (['id', 'booking_id', 'payment_id', 'method', 'status', 'transaction_code',
            'source', 'received_at', 'paid_at', 'policy_case', 'refund_ref', 'requested_at',
            'processed_at'] as $key) {
            if (property_exists($this->resource, $key)) {
                $result[$key] = $this->resource->$key;
            }
        }
        foreach (['exam_fee', 'discount_amount', 'service_fee', 'total_amount',
            'received_amount', 'refunded_amount', 'amount', 'exam_fee_refunded', 'service_fee_refunded'] as $key) {
            if (property_exists($this->resource, $key)) {
                $result[$key] = (int) $this->resource->$key;
            }
        }

        return $result;
    }
}
