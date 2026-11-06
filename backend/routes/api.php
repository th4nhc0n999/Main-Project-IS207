<?php

use App\Http\Controllers\BookingHistoryController;
use App\Http\Controllers\HospitalBookingController;
use App\Http\Controllers\TicketController;
use App\Http\Middleware\EnsureActiveBookingAccount;
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
});
