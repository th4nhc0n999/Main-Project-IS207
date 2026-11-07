<?php

namespace App\Http\Requests\Bkd;

use Illuminate\Foundation\Http\FormRequest;

class SlotListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['date' => ['required', 'date_format:Y-m-d']];
    }
}
