<?php

$localMomo = [];
if (env('APP_ENV') === 'local') {
    $path = storage_path('app/private/momo-sandbox.local.json');
    if (is_readable($path)) {
        $localMomo = json_decode(file_get_contents($path), true) ?? [];
    }
}

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
    // Sandbox only. Credentials may be supplied by the process environment;
    // no changes to .env or .env.example are required by this integration.
    'momo' => [
        'partner_code' => env('MOMO_PARTNER_CODE', $localMomo['partner_code'] ?? null),
        'access_key' => env('MOMO_ACCESS_KEY', $localMomo['access_key'] ?? null),
        'secret_key' => env('MOMO_SECRET_KEY', $localMomo['secret_key'] ?? null),
        'ipn_url' => env('MOMO_IPN_URL'),
        'redirect_url' => env('MOMO_REDIRECT_URL'),
    ],
];
