<?php

use App\Http\Controllers\Api\Admin\AdminDemoController;
use App\Http\Controllers\Api\Admin\BookingAdminController;
use App\Http\Controllers\Api\Admin\DoctorAdminController;
use App\Http\Controllers\Api\Admin\ExamTypeAdminController;
use App\Http\Controllers\Api\Admin\HospitalAdminController;
use App\Http\Controllers\Api\Admin\NoShowAdminController;
use App\Http\Controllers\Api\Admin\RefundAdminController;
use App\Http\Controllers\Api\Admin\ReportAdminController;
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

    // Màn hình Quản trị Hoàn tiền (Refund Console - S4-34)
    Route::get('/refunds', [RefundAdminController::class, 'index']);
    Route::get('/refunds/{id}', [RefundAdminController::class, 'show'])->whereNumber('id');
    Route::post('/refunds/{id}/decide', [RefundAdminController::class, 'decide'])->whereNumber('id');
    Route::post('/refunds/{id}/process-simulation', [RefundAdminController::class, 'processSimulation'])->whereNumber('id');

    // Màn hình Quản trị Không đến khám & Khiếu nại (No-Show Console - S4-36 / E12)
    Route::get('/no-shows/eligible', [NoShowAdminController::class, 'eligible']);
    Route::post('/no-shows/bookings/{id}/confirm', [NoShowAdminController::class, 'confirm'])->whereNumber('id');
    Route::post('/no-shows/bookings/{id}/complaint', [NoShowAdminController::class, 'complaint'])->whereNumber('id');

    // Bốn Báo cáo Quản trị Vận hành (S4-37 / RPT_ADM / DL-25)
    Route::prefix('reports')->group(function () {
        Route::get('/booking-status', [ReportAdminController::class, 'bookingStatus']);
        Route::get('/net-revenue', [ReportAdminController::class, 'netRevenue']);
        Route::get('/cancellation-rate', [ReportAdminController::class, 'cancellationRate']);
        Route::get('/top-booked', [ReportAdminController::class, 'topBooked']);
    });

    // Chế độ Demo Sandbox (S4-33)
    Route::prefix('demo')->group(function () {
        Route::post('/bookings/{id}/simulate-payment', [AdminDemoController::class, 'simulatePayment'])->whereNumber('id');
        Route::post('/bookings/{id}/override-decision', [AdminDemoController::class, 'overrideDecision'])->whereNumber('id');
    });
});
