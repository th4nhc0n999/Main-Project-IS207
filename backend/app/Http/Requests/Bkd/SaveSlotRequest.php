<?php

namespace App\Http\Requests\Bkd;

use Illuminate\Foundation\Http\FormRequest;

class SaveSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'work_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'owner_id' => ['prohibited'], 'owner_type' => ['prohibited'],
            'specialty_id' => ['prohibited'], 'capacity' => ['prohibited'],
            'booked_count' => ['prohibited'], 'status' => ['prohibited'],
        ];
    }
}
