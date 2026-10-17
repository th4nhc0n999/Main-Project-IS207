<?php

namespace App\Http\Requests\Payment;

use App\Enums\PaymentMethod;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class CreatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id' => [
                'required',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (is_int($value) && $value > 0) {
                        return;
                    }
                    if (is_string($value) && preg_match('/^(?:[1-9][0-9]{0,18}|BK[A-Za-z0-9]{1,18})$/D', $value)) {
                        return;
                    }

                    $fail('Mã đơn đặt khám phải là ID nguyên dương hoặc mã booking bắt đầu bằng BK.');
                },
            ],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'booking_id.required' => 'Mã hoặc ID đơn đặt khám là bắt buộc.',
            'method.required' => 'Vui lòng chọn phương thức thanh toán.',
            'method.Illuminate\Validation\Rules\Enum' => 'Phương thức thanh toán không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Dữ liệu yêu cầu không hợp lệ.',
            'data' => null,
            'errors' => $validator->errors(),
        ], 422));
    }
}
