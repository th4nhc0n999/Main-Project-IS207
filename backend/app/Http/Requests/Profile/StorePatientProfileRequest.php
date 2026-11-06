<?php

namespace App\Http\Requests\Profile;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;
        $threshold = (int) config('medsi.guardian_age_threshold', 16);

        $isChild = false;
        if ($this->filled('dob')) {
            try {
                $isChild = Carbon::parse($this->input('dob'))->age < $threshold;
            } catch (\Throwable $e) {
                $isChild = false;
            }
        }

        return [
            'full_name' => ['required', 'string', 'max:150'],
            'dob' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', Rule::in(['male', 'female', 'other'])],
            'phone' => ['nullable', 'string', 'regex:/^(0[3|5|7|8|9])[0-9]{8}$/'],
            'relationship' => ['required', 'string', 'max:50'],
            'identity_card_number' => [
                'nullable',
                'string',
                'regex:/^[0-9]{9,12}$/',
                Rule::unique('patient_profiles')->where(function ($query) use ($userId) {
                    return $query->where('user_id', $userId)->whereNull('deleted_at');
                }),
            ],
            'health_insurance_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],

            // Người giám hộ bắt buộc khi tuổi dưới ngưỡng cấu hình
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

            // Bắt buộc đồng ý điều khoản
            'consent_agreed' => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'guardian_name.required' => 'Họ tên người giám hộ là bắt buộc đối với bệnh nhân dưới 16 tuổi.',
            'guardian_phone.required' => 'Số điện thoại người giám hộ là bắt buộc đối với bệnh nhân dưới 16 tuổi.',
            'guardian_relationship.required' => 'Mối quan hệ với người giám hộ là bắt buộc đối với bệnh nhân dưới 16 tuổi.',
            'consent_agreed.accepted' => 'Bạn phải đồng ý với điều khoản sử dụng và chính sách xử lý dữ liệu y tế.',
            'consent_agreed.required' => 'Bạn phải xác nhận đồng ý điều khoản để tạo hồ sơ.',
            'identity_card_number.unique' => 'Số CCCD/Định danh này đã tồn tại trong danh sách hồ sơ của bạn.',
        ];
    }
}
