<?php

namespace Database\Factories;

use App\Models\PatientConsent;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientConsentFactory extends Factory
{
    protected $model = PatientConsent::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'patient_profile_id' => PatientProfile::factory(),
            'policy_version' => 'v1.0',
            'is_agreed' => true,
            'agreed_at' => now(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'revoked_at' => null,
        ];
    }
}
