<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MomoIpnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Server-to-server: MomoSandboxService verifies the HMAC and order identity.
    }

    public function rules(): array
    {
        return [
            'partnerCode' => ['required', 'string', 'max:100'],
            'orderId' => ['required', 'string', 'max:64'],
            'requestId' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'resultCode' => ['required', 'integer'],
            'transId' => ['required', 'integer', 'min:0'],
            'responseTime' => ['required', 'integer', 'min:1'],
            'orderInfo' => ['required', 'string', 'max:255'],
            'orderType' => ['required', 'string', 'max:100'],
            'message' => ['present', 'nullable', 'string', 'max:1000'],
            'payType' => ['present', 'nullable', 'string', 'max:100'],
            'extraData' => ['present', 'nullable', 'string', 'max:1000'],
            'signature' => ['required', 'string', 'regex:/^[a-fA-F0-9]{64}$/'],
        ];
    }
}
