<?php

namespace App\Http\Resources;

use App\Support\DataMasker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array with masked sensitive fields (CCCD, BHYT, SĐT)
     * trừ khi chủ sở hữu xem ở chế độ chỉnh sửa (mode=edit).
     */
    public function toArray(Request $request): array
    {
        $isOwnerForEdit = ($request->user()?->id === $this->user_id) &&
            ($request->query('mode') === 'edit' || $request->boolean('for_edit'));

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'dob' => $this->dob?->format('Y-m-d'),
            'gender' => $this->gender,
            'relationship' => $this->relationship,
            'phone' => $isOwnerForEdit ? $this->phone : DataMasker::maskPhone($this->phone),
            'identity_card_number' => $isOwnerForEdit ? $this->identity_card_number : DataMasker::maskIdentityCard($this->identity_card_number),
            'health_insurance_code' => $isOwnerForEdit ? $this->health_insurance_code : DataMasker::maskHealthInsurance($this->health_insurance_code),
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => $isOwnerForEdit ? $this->guardian_phone : DataMasker::maskPhone($this->guardian_phone),
            'guardian_relationship' => $this->guardian_relationship,
            'is_default' => (bool) $this->is_default,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
