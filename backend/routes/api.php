<?php

use App\Http\Controllers\Api\Admin\AdminBookingOverrideController;
use App\Http\Controllers\Api\Admin\AdminDemoController;
use App\Http\Controllers\Api\Admin\AdminDoctorController;
use App\Http\Controllers\Api\Admin\BookingAdminController;
use App\Http\Controllers\Api\Admin\DoctorAdminController;
use App\Http\Controllers\Api\Admin\ExamTypeAdminController;
use App\Http\Controllers\Api\Admin\HospitalAdminController;
use App\Http\Controllers\Api\Admin\NoShowAdminController;
use App\Http\Controllers\Api\Admin\RefundAdminController;
use App\Http\Controllers\Api\Admin\ReportAdminController;
use App\Http\Controllers\Api\Admin\SlotController;
use App\Http\Controllers\Api\Admin\SpecialtyController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\BookingHistoryController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\HospitalBookingController;
use App\Http\Controllers\TicketController;
use App\Http\Middleware\EnsureActiveBookingAccount;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::get('/directory', [DirectoryController::class, 'index']);
Route::get('/doctors/{doctor}', [DirectoryController::class, 'show'])->whereNumber('doctor');

Route::get('/hospitals', [HospitalBookingController::class, 'hospitals']);
Route::get('/hospitals/{hospital}/slots', [HospitalBookingController::class, 'slots'])->whereNumber('hospital');

Route::middleware(['auth:sanctum', EnsureActiveBookingAccount::class, 'throttle:60,1'])->group(function () {
    Route::get('/hospitals/{hospital}/booking-options', [HospitalBookingController::class, 'options'])->whereNumber('hospital');
    Route::post('/hospitals/{hospital}/slots', [HospitalBookingController::class, 'createSlot'])->whereNumber('hospital');
    Route::post('/hospital-bookings', [HospitalBookingController::class, 'store']);
    Route::post('/hospital-bookings/{booking}/cancel', [HospitalBookingController::class, 'cancel'])->whereNumber('booking');
    Route::get('/me/bookings', [BookingHistoryController::class, 'index']);
    Route::get('/bookings', [BookingHistoryController::class, 'index']);
    Route::get('/bookings/{booking}/ticket', [TicketController::class, 'show'])->whereNumber('booking');
    Route::get('/bookings/{booking}/ticket/qr.png', [TicketController::class, 'download'])->whereNumber('booking');
    Route::post('/tickets/check-in', [TicketController::class, 'checkIn']);
    Route::post('/doctors/{doctor}/bookings', [DirectoryController::class, 'book'])->whereNumber('doctor');
    Route::get('/me/bookings/{booking}', [DirectoryController::class, 'detail'])->whereNumber('booking');
});

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
        Route::get('/appointments', [DirectoryController::class, 'appointments']);
        Route::post('/appointments/{booking}/{action}', [DirectoryController::class, 'transition'])
            ->whereNumber('booking')->whereIn('action', ['approve','complete']);
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

// S4-32, S4-40..44: BKD routes. Keep other modules' routes intact above.
Route::middleware(\App\Http\Middleware\Bkd\ApiBoundary::class)->group(function () {
    Route::get('/doctors/{doctor}/slots', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'index'])
        ->whereNumber('doctor')->name('bkd.slots.index');

    Route::middleware(\App\Http\Middleware\Bkd\Authenticate::class.':sanctum')->group(function () {
        Route::middleware(\App\Http\Middleware\Bkd\RequireRole::class.':doctor')->group(function () {
            Route::get('/doctor/me', [\App\Http\Controllers\Api\Bkd\DoctorSelfController::class, 'show']);
            Route::get('/doctor/slots', [\App\Http\Controllers\Api\Bkd\DoctorSlotController::class, 'own']);
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
