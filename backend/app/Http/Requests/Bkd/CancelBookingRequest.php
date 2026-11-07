<?php

namespace App\Http\Requests\Bkd;

use Illuminate\Foundation\Http\FormRequest;

class CancelBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['version' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:255'],
            // No invented business catalog; validate shape only pending team agreement.
            'reason_code' => ['nullable', 'string', 'max:30', 'regex:/\A[A-Za-z0-9_-]+\z/']];
    }
}
