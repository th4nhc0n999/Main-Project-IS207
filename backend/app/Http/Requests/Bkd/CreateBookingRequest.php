<?php

namespace App\Http\Requests\Bkd;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'integer', 'min:1'],
            'slot_id' => ['required', 'integer', 'min:1'],
            'patient_profile_id' => ['required', 'integer', 'min:1'],
            'symptoms' => ['nullable', 'string', 'max:'.config('medsi.symptoms_max_length')],
            'request_key' => ['required', 'string', 'max:64', 'regex:/\A[A-Za-z0-9_-]+\z/'],
            'user_id' => ['prohibited'], 'status' => ['prohibited'], 'patient_snapshot' => ['prohibited'],
            'exam_fee' => ['prohibited'], 'service_fee' => ['prohibited'], 'total_amount' => ['prohibited'],
            'hospital_id' => ['prohibited'], 'exam_type_id' => ['prohibited'],
        ];
    }
}
