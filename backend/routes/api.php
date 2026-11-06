<?php

use App\Http\Controllers\Api\Admin\AdminBookingOverrideController;
use App\Http\Controllers\Api\Admin\AdminDoctorController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated routes
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    // Auth actions
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/first-login-change-password', [AuthController::class, 'firstLoginChangePassword']);
    });

    // Patient routes
    Route::middleware('role:patient')->prefix('patient')->group(function () {
        Route::get('/bookings/{booking}', function (Booking $booking) {
            Gate::authorize('view', $booking);
            return response()->json(['booking' => $booking]);
        });
    });

    // Doctor routes
    Route::middleware('role:doctor')->prefix('doctor')->group(function () {
        Route::get('/bookings/{booking}', function (Booking $booking) {
            Gate::authorize('view', $booking);
            return response()->json(['booking' => $booking]);
        });
    });

    // Staff routes (requires assigned hospital_id)
    Route::middleware(['role:staff', 'staff.hospital'])->prefix('staff')->group(function () {
        Route::post('/bookings/{booking}/check-in', function (Booking $booking) {
            Gate::authorize('checkIn', $booking);
            return response()->json(['message' => 'Check-in thành công.']);
        });
    });

    // Admin routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // S4-12: Doctor account creation
        Route::post('/doctors/account', [AdminDoctorController::class, 'createDoctorAccount']);

        // S4-35: Booking manual overrides
        Route::post('/bookings/{id}/cancel', [AdminBookingOverrideController::class, 'cancel']);
        Route::post('/bookings/{id}/check-in', [AdminBookingOverrideController::class, 'manualCheckIn']);
        Route::post('/bookings/{id}/complete', [AdminBookingOverrideController::class, 'manualComplete']);
        Route::post('/bookings/{id}/no-show', [AdminBookingOverrideController::class, 'manualNoShow']);
    });
});
