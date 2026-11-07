<?php

use App\Http\Controllers\BookingHistoryController;
use App\Http\Controllers\HospitalBookingController;
use App\Http\Controllers\TicketController;
use App\Http\Middleware\EnsureActiveBookingAccount;
use App\Http\Controllers\Api\Admin\AdminBookingOverrideController;
use App\Http\Controllers\Api\Admin\AdminDoctorController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::get('/hospitals', [HospitalBookingController::class, 'hospitals']);
Route::get('/hospitals/{hospital}/slots', [HospitalBookingController::class, 'slots'])->whereNumber('hospital');

Route::middleware(['auth:sanctum', EnsureActiveBookingAccount::class, 'throttle:60,1'])->group(function () {
    Route::get('/hospitals/{hospital}/booking-options', [HospitalBookingController::class, 'options'])->whereNumber('hospital');
    Route::post('/hospitals/{hospital}/slots', [HospitalBookingController::class, 'createSlot'])->whereNumber('hospital');
    Route::post('/hospital-bookings', [HospitalBookingController::class, 'store']);
    Route::get('/me/bookings', [BookingHistoryController::class, 'index']);
    Route::get('/bookings', [BookingHistoryController::class, 'index']);
    Route::get('/bookings/{booking}/ticket', [TicketController::class, 'show'])->whereNumber('booking');
    Route::get('/bookings/{booking}/ticket/qr.png', [TicketController::class, 'download'])->whereNumber('booking');
    Route::post('/tickets/check-in', [TicketController::class, 'checkIn']);
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

    // Phân hệ Hồ sơ bệnh nhân (Sprint 4: S4-20..25)
    Route::post('patient-profiles/{id}/restore', [PatientProfileController::class, 'restore']);
    Route::post('patient-profiles/{patient_profile}/revoke-consent', [PatientProfileController::class, 'revokeConsent']);
    Route::apiResource('patient-profiles', PatientProfileController::class);

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

// PAY — S4-60..64. Keep the existing routes above unchanged.
Route::post('/payments/momo/ipn', [\App\Http\Controllers\Api\PaymentController::class, 'momoIpn'])
    ->middleware(\App\Http\Middleware\PaymentApi::class);
Route::post('/payments/gateway/callback', [\App\Http\Controllers\Api\PaymentController::class, 'callback'])
    ->middleware(\App\Http\Middleware\PaymentApi::class);
Route::middleware([\App\Http\Middleware\PaymentApi::class.':sanctum', 'active', 'role:patient,admin'])->group(function () {
    Route::post('/payments/momo/transactions/{code}/query', [\App\Http\Controllers\Api\PaymentController::class, 'momoQuery']);
    Route::post('/payments/start', [\App\Http\Controllers\Api\PaymentController::class, 'start']);
    Route::get('/payments/bookings/{booking}', [\App\Http\Controllers\Api\PaymentController::class, 'show'])->whereNumber('booking');
    Route::post('/payments/simulate', [\App\Http\Controllers\Api\PaymentController::class, 'simulate']);
    Route::get('/payments/transactions/{code}', [\App\Http\Controllers\Api\PaymentController::class, 'transaction']);
    Route::post('/payments/bookings/{booking}/counter-confirm', [App\Http\Controllers\Api\Admin\PaymentController::class, 'counter'])->whereNumber('booking')->middleware('role:admin');
    Route::post('/payments/refunds/{refund}/transition', [App\Http\Controllers\Api\Admin\PaymentController::class, 'refund'])->whereNumber('refund')->middleware('role:admin');
});
