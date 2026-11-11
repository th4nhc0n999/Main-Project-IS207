<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route()->getActionMethod()) {
            'start' => ['booking_id' => ['required', 'integer', 'min:1'],
                'method' => ['required', 'in:atm,credit_card,qr_pay,momo']],
            'simulate' => ['transaction_code' => ['required', 'string', 'max:64'],
                'status' => ['required', 'in:success,failed']],
            'callback' => ['booking_id' => ['required', 'integer', 'min:1'],
                'transaction_code' => ['required', 'string', 'max:64'],
                'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
                'status' => ['required', 'in:success,failed']],
            'refund' => ['status' => ['required', 'in:approved,rejected,processing,succeeded,failed']],
            default => [],
        };
    }
}
