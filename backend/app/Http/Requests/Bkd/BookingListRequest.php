<?php

namespace App\Http\Requests\Bkd;

use App\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookingListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['date' => ['sometimes', 'date_format:Y-m-d'],
            'status' => ['sometimes', Rule::enum(BookingStatus::class)],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1']];
    }
}
