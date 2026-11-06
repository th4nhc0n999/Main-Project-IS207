<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// S4-32, S4-40..44: BKD routes. Keep other modules' routes intact above.
Route::middleware(\App\Http\Middleware\Bkd\ApiBoundary::class)->group(function () {
    Route::get('/doctors/{doctor}/slots', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'index'])
        ->whereNumber('doctor')->name('bkd.slots.index');

    Route::middleware(\App\Http\Middleware\Bkd\Authenticate::class.':sanctum')->group(function () {
        Route::middleware(\App\Http\Middleware\Bkd\RequireRole::class.':doctor')->group(function () {
            Route::post('/doctor/slots', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'store'])->name('bkd.slots.store');
            Route::put('/doctor/slots/{slot}', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'update'])->whereNumber('slot');
            Route::get('/doctor/bookings', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'index'])->name('bkd.doctor.index');
            Route::post('/doctor/bookings/{booking}/approve', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'approve'])
                ->whereNumber('booking')->name('bkd.doctor.approve');
            Route::post('/doctor/bookings/{booking}/reject', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'reject'])->whereNumber('booking');
        });
        Route::middleware(\App\Http\Middleware\Bkd\RequireRole::class.':admin')->group(function () {
            Route::put('/admin/doctor-slots/{slot}', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'update'])->whereNumber('slot');
            Route::post('/admin/doctor-slots/{slot}/block', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'block'])->whereNumber('slot');
        });
        Route::middleware(\App\Http\Middleware\Bkd\RequireRole::class.':patient')->group(function () {
            Route::post('/doctor-bookings', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'store']);
            Route::get('/patient/doctor-bookings', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'index']);
        });
        Route::middleware(\App\Http\Middleware\Bkd\RequireRole::class.':patient,doctor')->group(function () {
            Route::get('/doctor-bookings/{booking}', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'show'])->whereNumber('booking');
            Route::post('/doctor-bookings/{booking}/cancel', [\App\Http\Controllers\Api\Bkd\DoctorBookingController::class, 'cancel'])->whereNumber('booking');
        });
    });
});
