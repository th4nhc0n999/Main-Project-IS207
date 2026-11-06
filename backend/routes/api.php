<?php

use App\Http\Controllers\Api\Admin\AdminDemoController;
use App\Http\Controllers\Api\Admin\BookingAdminController;
use App\Http\Controllers\Api\Admin\DoctorAdminController;
use App\Http\Controllers\Api\Admin\ExamTypeAdminController;
use App\Http\Controllers\Api\Admin\HospitalAdminController;
use App\Http\Controllers\Api\Admin\SlotController;
use App\Http\Controllers\Api\Admin\SpecialtyController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// -------------------------------------------------------------------------
// Admin: yêu cầu Bearer token + role = admin
// -------------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // Dashboard thống kê
    Route::get('/dashboard', [BookingAdminController::class, 'dashboard']);

    // CRUD Chuyên khoa (Specialties)
    Route::apiResource('specialties', SpecialtyController::class);

    // CRUD Bệnh viện (Hospitals)
    Route::apiResource('hospitals', HospitalAdminController::class);

    // CRUD Bác sĩ (Doctors)
    Route::apiResource('doctors', DoctorAdminController::class);

    // CRUD Loại khám (Exam Types)
    Route::apiResource('exam-types', ExamTypeAdminController::class);

    // CRUD Khung giờ khám (Slots)
    Route::apiResource('slots', SlotController::class);
    Route::post('/slots/batch', [SlotController::class, 'storeBatch']);
    Route::patch('/slots/{slot}/toggle-block', [SlotController::class, 'toggleBlock']);

    // Quản lý Booking
    Route::get('/bookings', [BookingAdminController::class, 'index']);
    Route::get('/bookings/{id}', [BookingAdminController::class, 'show'])->whereNumber('id');
    Route::patch('/bookings/{id}/status', [BookingAdminController::class, 'updateStatus'])->whereNumber('id');

    // Chế độ Demo Sandbox (S4-33)
    Route::prefix('demo')->group(function () {
        Route::post('/bookings/{id}/simulate-payment', [AdminDemoController::class, 'simulatePayment'])->whereNumber('id');
        Route::post('/bookings/{id}/override-decision', [AdminDemoController::class, 'overrideDecision'])->whereNumber('id');
    });
});
