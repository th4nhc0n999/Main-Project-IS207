<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Phí dịch vụ thanh toán
    |--------------------------------------------------------------------------
    |
    | Đơn vị là VNĐ. Đặt PAYMENT_SERVICE_FEE trong .env để thay đổi mà không
    | phải sửa mã nguồn.
    |
    */
    'service_fee' => (int) env('PAYMENT_SERVICE_FEE', 20000),

    /*
    |--------------------------------------------------------------------------
    | Gateway giả lập cho Mini Project
    |--------------------------------------------------------------------------
    |
    | Gateway giả lập chỉ nên bật ở local/testing. Khi tích hợp gateway thật,
    | endpoint xác nhận phải được thay bằng callback/webhook đã xác minh.
    |
    */
    'demo_gateway' => [
        'enabled' => (bool) env('PAYMENT_DEMO_GATEWAY_ENABLED', false),
        'otp' => (string) env('PAYMENT_DEMO_OTP', '123456'),
    ],
];
