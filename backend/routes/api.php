<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// -------------------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------------------

// Public: không cần token
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Protected: yêu cầu Bearer token (Sanctum)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
});

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
