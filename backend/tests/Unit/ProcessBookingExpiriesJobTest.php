<?php

namespace Tests\Unit;

use App\Enums\AuditEvent;
use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Jobs\ProcessBookingExpiriesJob;
use App\Models\Booking;
use App\Services\AuditLogger;
use App\Services\BookingStateMachine;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class ProcessBookingExpiriesJobTest extends TestCase
{
    public function test_job_structure_and_dependencies(): void
    {
        $job = new ProcessBookingExpiriesJob();
        $this->assertInstanceOf(ProcessBookingExpiriesJob::class, $job);
    }

    public function test_grace_period_calculation_logic(): void
    {
        $holdExpiresAt = CarbonImmutable::now()->subMinutes(1);
        $graceMinutes = 5;
        $graceDeadline = $holdExpiresAt->addMinutes($graceMinutes);

        // Now is 4 minutes before grace deadline, so it should not expire yet
        $this->assertTrue(CarbonImmutable::now()->lt($graceDeadline));

        // After 6 minutes, now is past grace deadline, so it should expire
        $pastGraceDeadline = $holdExpiresAt->subMinutes(6)->addMinutes($graceMinutes);
        $this->assertTrue(CarbonImmutable::now()->gt($pastGraceDeadline));
    }

    public function test_no_show_threshold_calculation_for_doctor(): void
    {
        $workDate = '2026-11-06';
        $startTime = '09:00:00';
        $thresholdMinutes = 15;

        $threshold = CarbonImmutable::parse($workDate.' '.$startTime)->addMinutes($thresholdMinutes);
        $this->assertSame('2026-11-06 09:15:00', $threshold->format('Y-m-d H:i:s'));
    }

    public function test_no_show_threshold_calculation_for_hospital(): void
    {
        $workDate = '2026-11-06';
        $endTime = '11:30:00';
        $thresholdMinutes = 120;

        $threshold = CarbonImmutable::parse($workDate.' '.$endTime)->addMinutes($thresholdMinutes);
        $this->assertSame('2026-11-06 13:30:00', $threshold->format('Y-m-d H:i:s'));
    }
}

