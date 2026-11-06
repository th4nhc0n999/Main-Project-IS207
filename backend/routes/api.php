<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// PAY — S4-60..64. Keep the existing routes above unchanged.
Route::middleware(\App\Http\Middleware\PaymentApi::class)->group(function () {
    Route::post('/payments/gateway/callback', [\App\Http\Controllers\Api\PaymentController::class, 'callback']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/payments/start', [\App\Http\Controllers\Api\PaymentController::class, 'start']);
        Route::get('/payments/bookings/{booking}', [\App\Http\Controllers\Api\PaymentController::class, 'show'])->whereNumber('booking');
        Route::post('/payments/simulate', [\App\Http\Controllers\Api\PaymentController::class, 'simulate']);
        Route::get('/payments/transactions/{code}', [\App\Http\Controllers\Api\PaymentController::class, 'transaction']);
        Route::post('/payments/bookings/{booking}/counter-confirm', [App\Http\Controllers\Api\Admin\PaymentController::class, 'counter'])->whereNumber('booking');
        Route::post('/payments/refunds/{refund}/transition', [App\Http\Controllers\Api\Admin\PaymentController::class, 'refund'])->whereNumber('refund');
    });
});
