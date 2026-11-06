<?php

namespace Tests\Feature\Bkd\Review;

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\PatientSnapshot;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Independent review regressions: assertions describe the required behavior.
 * Expected to FAIL against the reviewed application; never invert to bless bugs.
 * Fixtures and adapters below are synthetic and restricted to the test process.
 */
class ReviewRegressionTest extends TestCase
{
    private User $patient;

    private Slot $slot;

    private int $profileId;

    private int $doctorId;

    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (env('RUN_BKD_REVIEW_TESTS') !== '1') {
            $this->markTestSkipped('Opt in with RUN_BKD_REVIEW_TESTS=1 on a migrated MySQL test database.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        DB::beginTransaction();
        $this->transactionStarted = true;
        $this->travelTo(now()->setDate(2030, 1, 1)->setTime(8, 0));
        $suffix = bin2hex(random_bytes(4));
        $this->patient = User::create([
            'name' => 'Review synthetic patient', 'email' => 'review-'.$suffix.'@example.test',
            'password' => 'review-only-password', 'role' => 'patient', 'status' => 'active',
        ]);
        $specialty = DB::table('specialties')->insertGetId([
            'code' => 'R'.$suffix, 'name' => 'Review test specialty', 'slug' => 'review-'.$suffix,
        ]);
        $this->doctorId = DB::table('doctors')->insertGetId([
            'specialty_id' => $specialty, 'name' => 'Review synthetic doctor',
            'city' => 'Test', 'consultation_fee' => 200000,
        ]);
        $this->slot = Slot::create([
            'owner_type' => 'doctor', 'owner_id' => $this->doctorId, 'specialty_id' => $specialty,
            'work_date' => '2030-01-03', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
            'capacity' => 1, 'booked_count' => 0, 'status' => 'available',
        ]);
        $this->profileId = DB::table('patient_profiles')->insertGetId([
            'user_id' => $this->patient->id, 'full_name' => 'Review synthetic patient',
            'dob' => '2000-01-01', 'gender' => 'other', 'relationship' => 'self',
        ]);
        DB::table('patient_consents')->insert([
            'user_id' => $this->patient->id, 'patient_profile_id' => $this->profileId,
            'policy_version' => 'review-test', 'is_agreed' => true, 'agreed_at' => now(),
            'ip_address' => '127.0.0.1',
        ]);
        Sanctum::actingAs($this->patient);
    }

    protected function tearDown(): void
    {
        if ($this->transactionStarted) {
            DB::rollBack();
            $this->travelBack();
        }
        parent::tearDown();
    }

    public function test_high_01_cancellation_must_not_write_unmasked_identifiers_to_audit(): void
    {
        $booking = $this->pendingBooking('pending');
        // All identifiers are intentionally synthetic; no real patient information.
        $identity = '000000000001';
        $reason = 'Xin huỷ, CCCD '.$identity.', SĐT 0900000000.';
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', [
            'version' => $booking->version, 'reason' => $reason,
        ])->assertOk()->assertJsonPath('data.status', 'cancelled');

        $auditReason = DB::table('audit_logs')->where('entity_type', 'booking')
            ->where('entity_id', $booking->id)->where('action', 'T04')->value('reason');
        $this->assertNotNull($auditReason, 'Cancellation must retain an audit record.');
        $this->assertStringNotContainsString($identity, $auditReason,
            'Plan DoD requires that audit_logs never contain raw sensitive identifiers.');
    }

    public function test_medium_02_unpaid_cancellation_must_cancel_a_previously_failed_payment(): void
    {
        // T14 can leave a pending_payment booking with a failed payment before retry.
        $booking = $this->pendingBooking('failed');
        $response = $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', [
            'version' => $booking->version, 'reason' => 'Review cancellation after failed payment',
        ])->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(0, $this->slot->fresh()->booked_count);
        $response->assertJsonPath('data.payment.status', 'cancelled');
    }

    public function test_medium_03_a_star_appended_to_an_unmasked_identifier_must_not_pass_snapshot_validation(): void
    {
        $this->mock(PatientSnapshot::class)->shouldReceive('makePatientSnapshot')->once()->andReturn([
            'full_name' => 'Review synthetic patient', 'identity_card_number' => '000000000001*',
        ]);
        $this->mock(BookingPayment::class)->shouldReceive('ensurePendingPayment')->andReturnNull();
        $response = $this->postJson('/api/doctor-bookings', [
            'doctor_id' => $this->doctorId, 'slot_id' => $this->slot->id,
            'patient_profile_id' => $this->profileId, 'request_key' => 'review-invalid-mask',
        ]);
        // A full identifier plus a marker still exposes every original digit.
        $response->assertStatus(503)->assertJsonPath('code', 'BKD_INTEGRATION_UNAVAILABLE');
        $this->assertSame(0, Booking::where('user_id', $this->patient->id)->count());
    }

    private function pendingBooking(string $paymentStatus): Booking
    {
        // Arrange a legal persisted state, rather than testing unrelated adapters.
        $booking = Booking::create([
            'code' => 'RV'.bin2hex(random_bytes(6)), 'user_id' => $this->patient->id,
            'patient_profile_id' => $this->profileId, 'booking_type' => 'doctor',
            'doctor_id' => $this->doctorId, 'slot_id' => $this->slot->id,
            'patient_snapshot' => ['full_name' => 'Review synthetic patient'],
            'status' => BookingStatus::PENDING_PAYMENT, 'hold_expires_at' => now()->addMinutes(15),
            'version' => 1,
        ]);
        DB::table('payments')->insert([
            'booking_id' => $booking->id, 'exam_fee' => 200000, 'discount_amount' => 0,
            'service_fee' => 20000, 'total_amount' => 220000, 'received_amount' => 0,
            'refunded_amount' => 0, 'status' => $paymentStatus,
        ]);
        $this->slot->update(['booked_count' => 1, 'status' => 'full']);

        return $booking;
    }
}
