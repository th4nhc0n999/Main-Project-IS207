<?php

namespace App\Http\Requests\PatientProfile;

use Illuminate\Foundation\Http\FormRequest;

class PatientProfileRequest extends FormRequest
{
    /**
     * Xác định người dùng có quyền gửi request này hay không.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Chuẩn hóa dữ liệu đầu vào trước khi validate.
     */
    protected function prepareForValidation(): void
    {
        $sanitized = [];

        if ($this->has('full_name') && is_string($this->full_name)) {
            $sanitized['full_name'] = trim($this->full_name);
        }

        if ($this->has('phone') && is_string($this->phone)) {
            $sanitized['phone'] = trim($this->phone);
        }

        if ($this->has('relationship') && is_string($this->relationship)) {
            $sanitized['relationship'] = trim($this->relationship);
        }

        if (!empty($sanitized)) {
            $this->merge($sanitized);
        }
    }

    /**
     * Quy tắc kiểm tra tính hợp lệ của dữ liệu.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'full_name'    => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:150'],
            'dob'          => [$isUpdate ? 'sometimes' : 'required', 'date', 'before_or_equal:today'],
            'gender'       => [$isUpdate ? 'sometimes' : 'required', 'in:male,female,other'],
            'phone'        => ['nullable', 'string', 'max:20', 'regex:/^(0|\+84)[35789][0-9]{8}$/'],
            'relationship' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:50'],
        ];
    }

    /**
     * Tùy biến thông báo lỗi bằng tiếng Việt.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required'    => 'Họ và tên bệnh nhân không được để trống.',
            'full_name.string'      => 'Họ và tên bệnh nhân phải là chuỗi ký tự.',
            'full_name.max'         => 'Họ và tên bệnh nhân không được vượt quá 150 ký tự.',
            'dob.required'          => 'Ngày sinh không được để trống.',
            'dob.date'              => 'Ngày sinh không đúng định dạng ngày tháng.',
            'dob.before_or_equal'   => 'Ngày sinh không được lớn hơn ngày hiện tại.',
            'gender.required'       => 'Giới tính không được để trống.',
            'gender.in'             => 'Giới tính phải là nam, nữ hoặc khác.',
            'phone.string'          => 'Số điện thoại phải là chuỗi ký tự.',
            'phone.max'             => 'Số điện thoại không được vượt quá 20 ký tự.',
            'phone.regex'           => 'Số điện thoại không hợp lệ (phải là số di động Việt Nam hợp lệ 10 số, ví dụ 0901234567 hoặc +84901234567).',
            'relationship.required' => 'Mối quan hệ không được để trống.',
            'relationship.string'   => 'Mối quan hệ phải là chuỗi ký tự.',
            'relationship.max'      => 'Mối quan hệ không được vượt quá 50 ký tự.',
        ];
    }
}
