<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\Admin\SpecialtyController;
use App\Http\Controllers\Api\Admin\DoctorAdminController;
use App\Http\Controllers\Api\Admin\SlotController;
use App\Http\Controllers\Api\Admin\BookingAdminController;
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

// -------------------------------------------------------------------------
// Admin: yêu cầu Bearer token + role = admin
// -------------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // Dashboard thống kê
    Route::get('/dashboard', [BookingAdminController::class, 'dashboard']);

    // CRUD Chuyên khoa
    Route::apiResource('specialties', SpecialtyController::class);

    // CRUD Bác sĩ
    Route::apiResource('doctors', DoctorAdminController::class);

    // CRUD Khung giờ khám
    Route::apiResource('slots', SlotController::class);
    Route::post('/slots/batch',            [SlotController::class, 'storeBatch']);
    Route::patch('/slots/{slot}/toggle-block', [SlotController::class, 'toggleBlock']);

    // Quản lý Booking
    Route::get('/bookings',              [BookingAdminController::class, 'index']);
    Route::get('/bookings/{id}',         [BookingAdminController::class, 'show'])->whereNumber('id');
    Route::patch('/bookings/{id}/status', [BookingAdminController::class, 'updateStatus'])->whereNumber('id');
});