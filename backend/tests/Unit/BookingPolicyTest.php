<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use App\Policies\BookingPolicy;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class BookingPolicyTest extends TestCase
{
    private BookingPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new BookingPolicy();
    }

    public function test_admin_has_full_permissions(): void
    {
        $admin = (new User())->forceFill(['id' => 1, 'role' => 'admin']);
        $booking = (new Booking())->forceFill(['id' => 10, 'user_id' => 2]);

        $this->assertTrue($this->policy->view($admin, $booking));
        $this->assertTrue($this->policy->checkIn($admin, $booking));
        $this->assertTrue($this->policy->complete($admin, $booking));
        $this->assertTrue($this->policy->cancel($admin, $booking));
    }

    public function test_patient_can_only_view_own_booking(): void
    {
        $patient = (new User())->forceFill(['id' => 5, 'role' => 'patient']);
        $ownBooking = (new Booking())->forceFill(['id' => 10, 'user_id' => 5]);
        $otherBooking = (new Booking())->forceFill(['id' => 11, 'user_id' => 6]);

        $this->assertTrue($this->policy->view($patient, $ownBooking));
        $this->assertFalse($this->policy->view($patient, $otherBooking));
    }

    public function test_patient_cannot_check_in_or_complete_booking(): void
    {
        $patient = (new User())->forceFill(['id' => 5, 'role' => 'patient']);
        $booking = (new Booking())->forceFill(['id' => 10, 'user_id' => 5]);

        $this->assertFalse($this->policy->checkIn($patient, $booking));
        $this->assertFalse($this->policy->complete($patient, $booking));
    }

    public function test_staff_cannot_cancel_booking(): void
    {
        $staff = (new User())->forceFill(['id' => 8, 'role' => 'staff', 'hospital_id' => 2]);
        $booking = (new Booking())->forceFill(['id' => 10, 'hospital_id' => 2]);

        $this->assertFalse($this->policy->cancel($staff, $booking));
    }
}
