<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Chuẩn hóa dữ liệu User trả về qua API.
     * Lưu ý: trường `password` và `remember_token` đã bị ẩn trong Model ($hidden),
     * nên sẽ không bao giờ xuất hiện ở đây.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'phone'             => $this->phone,
            'role'              => $this->role,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),
            // Chỉ include khi relationship được load (tránh N+1)
            'patient_profiles'  => $this->whenLoaded('patientProfiles'),
        ];
    }
}
