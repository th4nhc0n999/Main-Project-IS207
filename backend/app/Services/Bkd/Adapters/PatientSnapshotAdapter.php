<?php

namespace App\Services\Bkd\Adapters;

use App\Contracts\Bkd\PatientSnapshot;
use App\Exceptions\Booking\BkdException;
use App\Models\PatientProfile;
use App\Services\PatientProfileService;
use App\Support\Bkd\SensitiveData;

class PatientSnapshotAdapter implements PatientSnapshot
{
    public function __construct(private PatientProfileService $profiles) {}

    public function makePatientSnapshot(object $profile): array
    {
        // Hydrate the already locked row; do not fetch a different profile/version.
        $model = $profile instanceof PatientProfile
            ? $profile : (new PatientProfile)->newFromBuilder((array) $profile);
        $snapshot = $this->profiles->makePatientSnapshot($model);
        $snapshot = array_intersect_key($snapshot, array_flip([
            'full_name', 'dob', 'gender', 'relationship', 'phone', 'identity_card_number',
            'health_insurance_code', 'guardian_name', 'guardian_phone', 'guardian_relationship',
        ]));
        foreach (['phone', 'identity_card_number', 'health_insurance_code', 'guardian_phone'] as $key) {
            $value = $snapshot[$key] ?? null;
            if ($value === null || $value === '') {
                continue;
            }
            if (! is_string($value)) {
                throw $this->invalidSnapshot();
            }
            $compact = preg_replace('/[\h+().-]/u', '', $value);
            $pattern = $key === 'health_insurance_code'
                ? '/\A[A-Za-z]{0,3}[0-9*•]+\z/u' : '/\A[0-9*•]+\z/u';
            if (! preg_match($pattern, $compact)) {
                throw $this->invalidSnapshot();
            }
            // Hiệu's format exposes more digits than BKD permits. Mask more of
            // that output, never reconstruct hidden digits from the raw profile.
            preg_match('/[0-9]{1,3}\z/', $compact, $suffix);
            $tail = $suffix[0] ?? '';
            $prefix = substr($compact, 0, strlen($compact) - strlen($tail));
            $snapshot[$key] = preg_replace('/[0-9]/', '*', $prefix).$tail;
            if (! SensitiveData::isMaskedIdentifier($snapshot[$key], $key === 'health_insurance_code')) {
                throw $this->invalidSnapshot();
            }
        }

        return $snapshot;
    }

    private function invalidSnapshot(): BkdException
    {
        return new BkdException('Snapshot hồ sơ không đúng hợp đồng che dữ liệu BKD.', 503, 'BKD_INTEGRATION_UNAVAILABLE');
    }
}
