<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

// -------------------------------------------------------------------------
// Public: không cần token
// -------------------------------------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// -------------------------------------------------------------------------
// Protected: yêu cầu Bearer token (Sanctum)
// -------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::match(['put', 'patch'], '/user', [ProfileController::class, 'update']);

    // Bookings & patient profiles
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::apiResource('patient-profiles', PatientProfileController::class);

    // Payments
    Route::prefix('payments')->group(function () {
        Route::post('/calculate-invoice', [PaymentController::class, 'calculateInvoice']);
        Route::post('/create',  [PaymentController::class, 'createPayment']);
        Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
        Route::post('/process', [PaymentController::class, 'processPayment']);
        Route::get('/{id}',          [PaymentController::class, 'show'])->whereNumber('id');
        Route::post('/{id}/cancel',  [PaymentController::class, 'cancel'])->whereNumber('id');
    });
});