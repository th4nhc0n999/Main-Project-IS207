<?php

namespace App\Http\Requests\Hospital;

use Illuminate\Foundation\Http\FormRequest;

class StoreHospitalBookingRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'hospital_id' => ['required', 'integer', 'min:1'],
            'exam_type_id' => ['required', 'integer', 'min:1'],
            'slot_id' => ['required', 'integer', 'min:1'],
            'patient_profile_id' => ['required', 'integer', 'min:1'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
            'success' => false, 'message' => 'Thông tin đặt khám không hợp lệ.',
            'data' => null, 'errors' => $validator->errors(),
        ], 422));
    }
}
