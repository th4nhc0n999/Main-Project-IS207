<?php

use App\Http\Controllers\Api\PatientProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::middleware('auth:sanctum')->group(function () {
    // Khôi phục hồ sơ đã xóa mềm
    Route::post('patient-profiles/{id}/restore', [PatientProfileController::class, 'restore']);

    // Rút đồng ý điều khoản xử lý dữ liệu
    Route::post('patient-profiles/{patient_profile}/revoke-consent', [PatientProfileController::class, 'revokeConsent']);

    // CRUD hồ sơ người khám
    Route::apiResource('patient-profiles', PatientProfileController::class);
});
