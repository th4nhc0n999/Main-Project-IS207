<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Xác định người dùng có quyền gửi request này hay không.
     * Chỉ người dùng đã đăng nhập mới được sửa thông tin tài khoản của chính mình.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Chuẩn hóa dữ liệu trước khi thực hiện validate.
     * Chỉ chuẩn hóa các trường có gửi lên để bảo đảm tính đúng đắn cho rule 'sometimes'.
     */
    protected function prepareForValidation(): void
    {
        $sanitized = [];

        if ($this->has('name') && is_string($this->name)) {
            $sanitized['name'] = trim($this->name);
        }

        if ($this->has('email') && is_string($this->email)) {
            $sanitized['email'] = strtolower(trim($this->email));
        }

        if ($this->has('phone') && is_string($this->phone)) {
            $sanitized['phone'] = trim($this->phone);
        }

        if (!empty($sanitized)) {
            $this->merge($sanitized);
        }
    }

    /**
     * Các quy tắc kiểm tra tính hợp lệ của dữ liệu đầu vào.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name'  => ['sometimes', 'required', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^(0|\+84)[35789][0-9]{8}$/',
            ],
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
            'name.required'  => 'Họ và tên không được để trống.',
            'name.string'    => 'Họ và tên phải là chuỗi ký tự.',
            'name.max'       => 'Họ và tên không được vượt quá 150 ký tự.',
            'email.required' => 'Địa chỉ email không được để trống.',
            'email.string'   => 'Địa chỉ email phải là chuỗi ký tự.',
            'email.email'    => 'Địa chỉ email không đúng định dạng.',
            'email.max'      => 'Địa chỉ email không được vượt quá 150 ký tự.',
            'email.unique'   => 'Email này đã được sử dụng bởi một tài khoản khác.',
            'phone.string'   => 'Số điện thoại phải là chuỗi ký tự.',
            'phone.max'      => 'Số điện thoại không được vượt quá 20 ký tự.',
            'phone.regex'    => 'Số điện thoại không hợp lệ (phải là số di động Việt Nam hợp lệ 10 số, ví dụ 0901234567 hoặc +84901234567).',
        ];
    }
}
