<?php

return [

    // 1. Các đường dẫn được áp dụng CORS (toàn bộ api và đường dẫn lấy cookie csrf)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // 2. Cho phép tất cả các phương thức HTTP: GET, POST, PUT, DELETE, OPTIONS
    'allowed_methods' => ['*'],

    // 3. Tên miền của Frontend được phép gọi API (cổng 5173 của Vite)
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ],

    // 3.1. Cho phép tất cả subdomain trên các nền tảng deploy phổ biến
    'allowed_origins_patterns' => [
        '/^https:\/\/.*\.onrender\.com$/',
        '/^https:\/\/.*\.vercel\.app$/',
        '/^https:\/\/.*\.netlify\.app$/',
    ],

    // 4. Cho phép gửi các header phổ biến (Authorization, Content-Type,...)
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // 5. Quan trọng: Đổi thành true để cho phép truyền Cookie / Token xác thực
    'supports_credentials' => true,

];
