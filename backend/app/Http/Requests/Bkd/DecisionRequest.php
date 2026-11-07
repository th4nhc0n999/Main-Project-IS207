<?php

namespace App\Http\Requests\Bkd;

use Illuminate\Foundation\Http\FormRequest;

class DecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['version' => ['required', 'integer', 'min:1'],
            'reason' => [$this->routeIs('bkd.doctor.approve') ? 'nullable' : 'required', 'string', 'max:255']];
    }
}
