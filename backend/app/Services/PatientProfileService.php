<?php

namespace App\Services;

use App\Exceptions\Profile\ProfileDeletionBlockedException;
use App\Models\PatientConsent;
use App\Models\PatientProfile;
use App\Models\User;
use App\Support\DataMasker;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PatientProfileService
{
    /**
     * Các trạng thái lịch khám đang xử lý hoặc giữ chỗ, ngăn không cho xóa hồ sơ
     */
    protected const BLOCKING_BOOKING_STATUSES = [
        'pending_payment',
        'pending_approval',
        'confirmed',
        'checked_in',
    ];

    /**
     * Danh sách hồ sơ chưa xóa của người dùng
     */
    public function listProfiles(User $user): Collection
    {
        return $user->patientProfiles()
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Tạo hồ sơ mới kèm theo bằng chứng Consent
     */
    public function createProfile(User $user, array $data, string $ip, ?string $userAgent): PatientProfile
    {
        return DB::transaction(function () use ($user, $data, $ip, $userAgent) {
            $maxProfiles = (int) config('medsi.max_profiles_per_user', 10);
            $currentCount = $user->patientProfiles()->count();

            if ($currentCount >= $maxProfiles) {
                throw ValidationException::withMessages([
                    'profile_limit' => "Mỗi tài khoản chỉ được phép tạo tối đa {$maxProfiles} hồ sơ.",
                ]);
            }

            $isDefault = (bool) ($data['is_default'] ?? false);
            if ($currentCount === 0 || $isDefault) {
                if ($isDefault) {
                    $user->patientProfiles()->update(['is_default' => false]);
                }
                $isDefault = true;
            }

            $profile = $user->patientProfiles()->create([
                'full_name' => $data['full_name'],
                'dob' => $data['dob'],
                'gender' => $data['gender'],
                'phone' => $data['phone'] ?? null,
                'relationship' => $data['relationship'],
                'identity_card_number' => $data['identity_card_number'] ?? null,
                'health_insurance_code' => $data['health_insurance_code'] ?? null,
                'guardian_name' => $data['guardian_name'] ?? null,
                'guardian_phone' => $data['guardian_phone'] ?? null,
                'guardian_relationship' => $data['guardian_relationship'] ?? null,
                'is_default' => $isDefault,
            ]);

            // Ghi nhận bằng chứng đồng ý điều khoản
            PatientConsent::create([
                'user_id' => $user->id,
                'patient_profile_id' => $profile->id,
                'policy_version' => config('medsi.policy_version', 'v1.0'),
                'is_agreed' => true,
                'agreed_at' => now(),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);

            return $profile;
        });
    }

    /**
     * Cập nhật thông tin hồ sơ
     */
    public function updateProfile(PatientProfile $profile, array $data): PatientProfile
    {
        return DB::transaction(function () use ($profile, $data) {
            if (!empty($data['is_default'])) {
                PatientProfile::where('user_id', $profile->user_id)
                    ->where('id', '<>', $profile->id)
                    ->update(['is_default' => false]);
            }

            $profile->update($data);
            return $profile->fresh();
        });
    }

    /**
     * Xóa hồ sơ theo chính sách 3 kịch bản:
     * 1. Lịch khám đang chờ -> Chặn với lỗi EX-PRF-06
     * 2. Đã từng có lịch sử khám -> Xóa mềm (soft delete)
     * 3. Chưa từng đặt lịch -> Xóa cứng (hard delete), giữ nguyên consent
     */
    public function deleteProfile(PatientProfile $profile): array
    {
        return DB::transaction(function () use ($profile) {
            // 1. Kiểm tra lịch khám đang chờ
            $hasActiveBooking = $profile->bookings()
                ->whereIn('status', self::BLOCKING_BOOKING_STATUSES)
                ->exists();

            if ($hasActiveBooking) {
                throw new ProfileDeletionBlockedException(
                    'Hồ sơ đang có lịch khám chờ xử lý, không thể xóa.',
                    'EX-PRF-06'
                );
            }

            // 2. Kiểm tra lịch sử khám
            $hasBookingHistory = $profile->bookings()->exists();

            if ($hasBookingHistory) {
                $profile->delete();

                return [
                    'action' => 'soft_deleted',
                    'message' => 'Hồ sơ đã được xóa mềm do có lịch sử đặt khám.',
                ];
            }

            // 3. Chưa từng đặt lịch khám: Xóa cứng
            // Bản ghi consent không có foreign key cứng nên vẫn được bảo lưu
            $profile->forceDelete();

            return [
                'action' => 'hard_deleted',
                'message' => 'Hồ sơ đã được xóa hoàn toàn.',
            ];
        });
    }

    /**
     * Bản chụp thông tin bệnh nhân đã che mờ phục vụ Booking
     */
    public function buildMaskedSnapshot(PatientProfile $profile): array
    {
        return [
            'profile_id' => $profile->id,
            'full_name' => $profile->full_name,
            'dob' => $profile->dob?->format('Y-m-d'),
            'gender' => $profile->gender,
            'relationship' => $profile->relationship,
            'phone' => DataMasker::maskPhone($profile->phone),
            'identity_card_number' => DataMasker::maskIdentityCard($profile->identity_card_number),
            'health_insurance_code' => $profile->health_insurance_code,
            'guardian_name' => $profile->guardian_name,
            'guardian_phone' => DataMasker::maskPhone($profile->guardian_phone),
            'guardian_relationship' => $profile->guardian_relationship,
            'captured_at' => now()->toIso8601String(),
        ];
    }
}
