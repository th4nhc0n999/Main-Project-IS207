<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\StorePatientProfileRequest;
use App\Http\Requests\Profile\UpdatePatientProfileRequest;
use App\Http\Resources\PatientProfileResource;
use App\Models\PatientProfile;
use App\Services\PatientProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PatientProfileController extends Controller
{
    public function __construct(
        protected PatientProfileService $profileService
    ) {}

    /**
     * Danh sách hồ sơ của người dùng đang đăng nhập
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $profiles = $this->profileService->listProfiles($request->user());
        return PatientProfileResource::collection($profiles);
    }

    /**
     * Chi tiết một hồ sơ
     */
    public function show(Request $request, PatientProfile $patientProfile): JsonResponse|PatientProfileResource
    {
        if ($patientProfile->user_id !== $request->user()?->id && $request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return new PatientProfileResource($patientProfile);
    }

    /**
     * Tạo hồ sơ mới
     */
    public function store(StorePatientProfileRequest $request): JsonResponse
    {
        $profile = $this->profileService->createProfile(
            $request->user(),
            $request->validated(),
            $request->ip() ?? '127.0.0.1',
            $request->userAgent()
        );

        return (new PatientProfileResource($profile))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Cập nhật thông tin hồ sơ
     */
    public function update(UpdatePatientProfileRequest $request, PatientProfile $patientProfile): PatientProfileResource
    {
        $updated = $this->profileService->updateProfile($patientProfile, $request->validated());
        return new PatientProfileResource($updated);
    }

    /**
     * Xóa hồ sơ (xử lý theo 3 kịch bản chính sách)
     */
    public function destroy(Request $request, PatientProfile $patientProfile): JsonResponse
    {
        if ($patientProfile->user_id !== $request->user()?->id && $request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $result = $this->profileService->deleteProfile($patientProfile);

        return response()->json([
            'success' => true,
            'action' => $result['action'],
            'message' => $result['message'],
        ]);
    }
}
