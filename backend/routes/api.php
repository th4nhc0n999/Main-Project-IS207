<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Payment Module Routes
Route::middleware('auth:sanctum')->prefix('payments')->group(function () {
    Route::post('/calculate-invoice', [\App\Http\Controllers\Api\PaymentController::class, 'calculateInvoice']);
    Route::post('/create', [\App\Http\Controllers\Api\PaymentController::class, 'createPayment']);
    Route::post('/confirm', [\App\Http\Controllers\Api\PaymentController::class, 'confirmPayment']);
    Route::post('/process', [\App\Http\Controllers\Api\PaymentController::class, 'processPayment']);
    Route::post('/', [\App\Http\Controllers\Api\PaymentController::class, 'confirmPayment']);
    Route::get('/{id}', [\App\Http\Controllers\Api\PaymentController::class, 'show'])->whereNumber('id');
    Route::post('/{id}/cancel', [\App\Http\Controllers\Api\PaymentController::class, 'cancel'])->whereNumber('id');
});
