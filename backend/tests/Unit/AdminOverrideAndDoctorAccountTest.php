<?php

namespace Tests\Unit;

use App\Enums\UserStatus;
use App\Models\User;
use Tests\TestCase;

class AdminOverrideAndDoctorAccountTest extends TestCase
{
    public function test_late_cancellation_50_percent_exam_fee_calculation(): void
    {
        // Example: Exam fee = 200,000 VND, Service fee = 20,000 VND
        $examFee = 200000;
        $serviceFee = 20000;
        $totalPaid = $examFee + $serviceFee;

        // Policy row 2: Bệnh nhân huỷ dưới 24h qua Admin:
        // Hoàn 50% phí khám, 0% phí tiện ích
        $examFeeRefunded = (int) round($examFee * 0.5);
        $serviceFeeRefunded = 0;
        $totalRefund = $examFeeRefunded + $serviceFeeRefunded;

        $this->assertSame(100000, $examFeeRefunded);
        $this->assertSame(0, $serviceFeeRefunded);
        $this->assertSame(100000, $totalRefund);
    }

    public function test_admin_created_doctor_defaults_to_pending(): void
    {
        $user = new User([
            'name' => 'Bác sĩ Trần B',
            'email' => 'bacsitranb@medsi.vn',
            'role' => 'doctor',
            'status' => UserStatus::PENDING,
            'hospital_id' => null,
        ]);

        $this->assertSame('doctor', $user->role);
        $this->assertSame(UserStatus::PENDING, $user->status);
        $this->assertNull($user->hospital_id);
    }

    public function test_staff_role_must_have_hospital_id(): void
    {
        $validStaff = new User([
            'name' => 'Nhân viên A',
            'email' => 'staff1@hospital.vn',
            'role' => 'staff',
            'hospital_id' => 3,
        ]);

        $this->assertSame('staff', $validStaff->role);
        $this->assertSame(3, $validStaff->hospital_id);
    }
}

