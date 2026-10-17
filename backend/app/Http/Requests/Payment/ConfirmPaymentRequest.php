<?php

namespace App\Http\Requests\Payment;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ConfirmPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_id' => ['required_without:booking_id', 'nullable', 'integer', 'min:1'],
            'booking_id' => ['required_without:payment_id', 'nullable'],
            'method' => ['nullable', 'string'],
            'otp' => ['nullable', 'string', 'digits:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_id.required_without' => 'Mã định danh giao dịch thanh toán hoặc đơn đặt khám là bắt buộc.',
            'payment_id.min' => 'Mã định danh giao dịch thanh toán không hợp lệ.',
            'otp.digits' => 'Mã OTP phải gồm đúng 6 chữ số.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Dữ liệu xác nhận không hợp lệ.',
            'data' => null,
            'errors' => $validator->errors(),
        ], 422));
    }
}
