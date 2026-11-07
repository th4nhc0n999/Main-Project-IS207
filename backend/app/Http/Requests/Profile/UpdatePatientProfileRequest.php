<?php

namespace App\Http\Requests\Profile;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->route('patient_profile');
        return auth()->check() && $profile && $profile->user_id === $this->user()?->id;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;
        $profile = $this->route('patient_profile');
        $threshold = (int) config('medsi.guardian_age_threshold', 16);

        $dob = $this->input('dob', $profile?->dob?->format('Y-m-d'));
        $isChild = false;
        if ($dob) {
            try {
                $isChild = Carbon::parse($dob)->age < $threshold;
            } catch (\Throwable $e) {
                $isChild = false;
            }
        }

        return [
            'full_name' => ['sometimes', 'required', 'string', 'max:150'],
            'dob' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'gender' => ['sometimes', 'required', Rule::in(['male', 'female', 'other'])],
            'phone' => ['nullable', 'string', 'regex:/^(0[3|5|7|8|9])[0-9]{8}$/'],
            'relationship' => ['sometimes', 'required', 'string', Rule::in(StorePatientProfileRequest::ALLOWED_RELATIONSHIPS)],
            'identity_card_number' => [
                'nullable',
                'string',
                'regex:/^[0-9]{9,12}$/',
                Rule::unique('patient_profiles')
                    ->ignore($profile?->id)
                    ->where(function ($query) use ($userId) {
                        return $query->where('user_id', $userId)->whereNull('deleted_at');
                    }),
            ],
            'health_insurance_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
            'guardian_name' => [
                Rule::requiredIf($isChild),
                'nullable',
                'string',
                'max:150',
            ],
            'guardian_phone' => [
                Rule::requiredIf($isChild),
                'nullable',
                'string',
                'regex:/^(0[3|5|7|8|9])[0-9]{8}$/',
            ],
            'guardian_relationship' => [
                Rule::requiredIf($isChild),
                'nullable',
                'string',
                'max:50',
            ],
        ];
    }
}
