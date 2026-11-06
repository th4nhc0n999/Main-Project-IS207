<?php

use App\Http\Controllers\Api\PatientProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('patient-profiles', PatientProfileController::class);
});
