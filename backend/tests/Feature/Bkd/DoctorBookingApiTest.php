<?php

namespace Tests\Feature\Bkd;

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\BookingRefund;
use App\Contracts\Bkd\BookingTicket;
use App\Contracts\Bkd\PatientSnapshot;
use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Enums\UserStatus;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use App\Services\BookingStateMachine;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class DoctorBookingApiTest extends TestCase
{
    private User $patient;

    private User $doctorUser;

    private User $admin;

    private int $doctorId;

    private int $specialtyId;

    private int $profileId;

    private string $suffix;

    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (env('RUN_BKD_MYSQL_TESTS') !== '1') {
            $this->markTestSkipped('Set RUN_BKD_MYSQL_TESTS=1 and use a migrated MySQL database ending in _test.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        DB::beginTransaction();
        $this->transactionStarted = true;
        $this->travelTo(now()->setDate(2030, 1, 1)->setTime(8, 0));
        $this->suffix = bin2hex(random_bytes(4));
        $this->patient = $this->user('patient');
        $this->doctorUser = $this->user('doctor');
        $this->admin = $this->user('admin');
        $this->specialtyId = DB::table('specialties')->insertGetId([
            'code' => 'B'.$this->suffix, 'name' => 'Chuyên khoa giả', 'slug' => 'bkd-'.$this->suffix,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->doctorId = DB::table('doctors')->insertGetId([
            'user_id' => $this->doctorUser->id, 'specialty_id' => $this->specialtyId,
            'name' => 'Bác sĩ giả', 'city' => 'TP.HCM', 'consultation_fee' => 200000,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->profileId = $this->profile($this->patient);
    }

    protected function tearDown(): void
    {
        if ($this->transactionStarted) {
            DB::rollBack();
            $this->travelBack();
        }
        parent::tearDown();
    }

    public function test_slot_listing_hides_past_and_reports_bookability(): void
    {
        $past = $this->slot('2030-01-01', '07:00:00');
        $tooSoon = $this->slot('2030-01-01', '09:00:00');
        $valid = $this->slot('2030-01-01', '10:00:00');
        $response = $this->getJson('/api/doctors/'.$this->doctorId.'/slots?date=2030-01-01')->assertOk();
        $response->assertJsonPath('success', true)->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $tooSoon->id)->assertJsonPath('data.0.can_book', false)
            ->assertJsonPath('data.1.id', $valid->id)->assertJsonPath('data.1.remaining_places', 1)
            ->assertJsonPath('data.1.can_book', true);
        $this->assertNotContains($past->id, array_column($response->json('data'), 'id'));
        $this->getJson('/api/doctors/'.$this->doctorId.'/slots?date=invalid')->assertStatus(422)
            ->assertJsonPath('success', false)->assertJsonStructure(['message', 'data', 'errors']);
    }

    public function test_slot_creation_authorization_overlap_and_protected_fields(): void
    {
        $this->postJson('/api/doctor/slots', [])->assertUnauthorized()->assertJsonPath('success', false);
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor/slots', [])->assertForbidden();
        Sanctum::actingAs($this->doctorUser);
        $payload = ['work_date' => '2030-01-02', 'start_time' => '09:00'];
        $this->postJson('/api/doctor/slots', $payload + ['capacity' => 2])->assertStatus(422);
        $this->postJson('/api/doctor/slots', $payload)->assertCreated()
            ->assertJsonPath('data.capacity', 1)->assertJsonPath('data.doctor_id', $this->doctorId)
            ->assertJsonPath('data.specialty_id', $this->specialtyId)->assertJsonPath('data.end_time', '09:30:00');
        $this->postJson('/api/doctor/slots', ['work_date' => '2030-01-02', 'start_time' => '09:15'])
            ->assertStatus(409)->assertJsonPath('code', 'SE001');
        $this->postJson('/api/doctor/slots', ['work_date' => '2030-01-02', 'start_time' => '09:30'])->assertCreated();
    }

    public function test_admin_can_block_but_cannot_edit_a_held_slot(): void
    {
        $booking = $this->createBooking();
        Sanctum::actingAs($this->admin);
        $this->putJson('/api/admin/doctor-slots/'.$booking->slot_id, [
            'work_date' => '2030-01-03', 'start_time' => '10:00',
        ])->assertStatus(409);
        $this->postJson('/api/admin/doctor-slots/'.$booking->slot_id.'/block')->assertOk()
            ->assertJsonPath('data.status', 'blocked')->assertJsonPath('data.booked_count', 1);
        $this->assertSame(BookingStatus::PENDING_PAYMENT, $booking->fresh()->status);
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/admin/doctor-slots/'.$booking->slot_id.'/block')->assertForbidden();
    }

    public function test_create_uses_server_price_masked_snapshot_and_idempotency(): void
    {
        $this->bindCreation();
        Sanctum::actingAs($this->patient);
        $slot = $this->slot();
        $payload = $this->payload($slot);
        $first = $this->postJson('/api/doctor-bookings', $payload)->assertOk()
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.payment.total_amount', 220000)
            ->assertJsonPath('data.payment.discount_amount', 0);
        $id = $first->json('data.id');
        $booking = Booking::findOrFail($id);
        $this->assertSame(900, $booking->hold_expires_at->getTimestamp() - now()->getTimestamp());
        $this->assertNull($booking->hospital_id);
        $this->assertStringContainsString('*', $booking->patient_snapshot['identity_card_number']);
        $this->assertStringNotContainsString('012345678901', $first->getContent());
        $this->assertStringNotContainsString('password', $first->getContent());
        // Retry also works without adapters: no second payment, hold or service call.
        $this->app->forgetInstance(BookingPayment::class);
        $this->postJson('/api/doctor-bookings', $payload)->assertOk()->assertJsonPath('data.id', $id);
        $this->assertSame(1, Slot::findOrFail($slot->id)->booked_count);
        $this->assertSame(1, DB::table('payments')->where('booking_id', $id)->count());
        $payload['symptoms'] = 'Nội dung khác';
        $this->postJson('/api/doctor-bookings', $payload)->assertStatus(409)->assertJsonPath('code', 'IDEMPOTENCY_CONFLICT');
    }

    public function test_missing_or_failed_integrations_do_not_leave_a_booking_or_hold(): void
    {
        // Production adapters are now bound; explicitly remove one for this outage case.
        $this->app->offsetUnset(PatientSnapshot::class);
        Sanctum::actingAs($this->patient);
        $slot = $this->slot();
        $this->postJson('/api/doctor-bookings', $this->payload($slot))->assertStatus(503)
            ->assertJsonPath('code', 'BKD_INTEGRATION_UNAVAILABLE');
        $this->bindCreation();
        $this->mock(BookingPayment::class)->shouldReceive('ensurePendingPayment')->once()->andThrow(new RuntimeException('test adapter failure'));
        $this->postJson('/api/doctor-bookings', $this->payload($slot))->assertStatus(500)->assertJsonPath('success', false);
        $this->assertSame(0, Slot::findOrFail($slot->id)->booked_count);
        $this->assertSame(0, Booking::where('user_id', $this->patient->id)->count());
        $this->assertSame(0, DB::table('payments')->count());
    }

    public function test_rejects_unmasked_snapshot_from_adapter(): void
    {
        $this->mock(PatientSnapshot::class)->shouldReceive('makePatientSnapshot')->andReturn([
            'full_name' => 'Người giả', 'identity_card_number' => '012345678901',
        ]);
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot()))->assertStatus(503);
        $this->assertSame(0, Booking::where('user_id', $this->patient->id)->count());
    }

    public function test_booking_rules_reject_lead_time_and_conflicting_specialty(): void
    {
        $this->bindCreation();
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-01', '09:59:00')))->assertStatus(422);
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-02-01')))->assertStatus(422);
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-01', '10:00:00')))->assertOk();
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-01', '11:00:00'), 'second'))
            ->assertStatus(409)->assertJsonPath('code', 'SE001');
    }

    public function test_maximum_30_day_boundary_and_spoofed_server_fields(): void
    {
        $this->bindCreation();
        Sanctum::actingAs($this->patient);
        $payload = $this->payload($this->slot('2030-01-31', '08:00:00'));
        $this->postJson('/api/doctor-bookings', $payload + ['total_amount' => 1])->assertStatus(422);
        $this->postJson('/api/doctor-bookings', $payload)->assertOk();
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-31', '08:01:00'), 'too-late'))
            ->assertStatus(409); // Same-specialty conflict takes precedence; lead-time tested separately below.
        $otherProfile = $this->profile($this->patient, null);
        $outside = $this->payload($this->slot('2030-01-31', '09:00:00'), 'outside');
        $outside['patient_profile_id'] = $otherProfile;
        $this->postJson('/api/doctor-bookings', $outside)->assertStatus(422);
    }

    public function test_overlap_across_specialties_and_locked_accounts_are_rejected(): void
    {
        $this->createBooking($this->slot());
        $otherSpecialty = DB::table('specialties')->insertGetId([
            'code' => 'C'.$this->suffix, 'name' => 'Khoa giả thứ hai', 'slug' => 'other-'.$this->suffix,
        ]);
        $otherDoctor = DB::table('doctors')->insertGetId([
            'specialty_id' => $otherSpecialty, 'name' => 'Bác sĩ giả khác', 'city' => 'Test', 'consultation_fee' => 200000,
        ]);
        $slot = Slot::create(['owner_type' => 'doctor', 'owner_id' => $otherDoctor,
            'specialty_id' => $otherSpecialty, 'work_date' => '2030-01-02', 'start_time' => '09:15:00',
            'end_time' => '09:45:00', 'capacity' => 1, 'booked_count' => 0, 'status' => 'available']);
        $payload = $this->payload($slot, 'overlap');
        $payload['doctor_id'] = $otherDoctor;
        $this->postJson('/api/doctor-bookings', $payload)->assertStatus(409)->assertJsonPath('code', 'SE001');
        $this->patient->status = UserStatus::LOCKED;
        $this->patient->save();
        Sanctum::actingAs($this->patient);
        $this->getJson('/api/patient/doctor-bookings')->assertForbidden();
    }

    public function test_failed_ticket_adapter_rolls_back_confirmation_and_audit(): void
    {
        $booking = $this->paidBooking();
        $audits = DB::table('audit_logs')->where('entity_type', 'booking')->where('entity_id', $booking->id)->count();
        $this->mock(BookingTicket::class)->shouldReceive('issueFor')->once()->andThrow(new RuntimeException('test failure'));
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/approve', ['version' => $booking->version])->assertStatus(500);
        $this->assertSame(BookingStatus::PENDING_APPROVAL, $booking->fresh()->status);
        $this->assertSame($audits, DB::table('audit_logs')->where('entity_type', 'booking')->where('entity_id', $booking->id)->count());
    }

    public function test_foreign_profile_and_revoked_consent_cannot_book(): void
    {
        $this->bindCreation();
        $slot = $this->slot();
        $other = $this->user('patient');
        Sanctum::actingAs($other);
        $this->postJson('/api/doctor-bookings', $this->payload($slot))->assertNotFound();
        Sanctum::actingAs($this->patient);
        DB::table('patient_consents')->where('patient_profile_id', $this->profileId)->update(['revoked_at' => now()]);
        $this->postJson('/api/doctor-bookings', $this->payload($slot))->assertStatus(422);
        $this->assertSame(0, $slot->fresh()->booked_count);
    }

    public function test_three_active_booking_limit_includes_checked_in(): void
    {
        $this->createBooking($this->slot('2030-01-02'));
        $this->createBooking($this->slot('2030-01-03'));
        $third = $this->createBooking($this->slot('2030-01-04'));
        // Fixture setup only; production transitions always use the state machine.
        DB::table('bookings')->where('id', $third->id)->update(['status' => BookingStatus::CHECKED_IN->value]);
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-05'), 'fourth'))->assertStatus(422);
    }

    public function test_approval_requires_owner_deadline_version_and_ticket_adapter(): void
    {
        $booking = $this->paidBooking();
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/approve', ['version' => $booking->version])->assertForbidden();
        Sanctum::actingAs($this->doctorUser);
        $url = '/api/doctor/bookings/'.$booking->id.'/approve';
        $this->postJson($url, ['version' => 1])->assertStatus(409)->assertJsonPath('code', 'STALE_VERSION');
        $this->app->offsetUnset(BookingTicket::class);
        $this->postJson($url, ['version' => $booking->version])->assertStatus(503);
        $this->assertSame(BookingStatus::PENDING_APPROVAL, $booking->fresh()->status);
        $this->mock(BookingTicket::class)->shouldReceive('issueFor')->once()->with(Mockery::on(
            fn ($b) => $b->id === $booking->id && $b->status === BookingStatus::CONFIRMED));
        $this->postJson($url, ['version' => $booking->version])->assertOk()->assertJsonPath('data.status', 'confirmed');
        $this->postJson($url, ['version' => $booking->version])->assertStatus(409);
        $this->assertSame(1, Slot::findOrFail($booking->slot_id)->booked_count);
    }

    public function test_other_doctor_cannot_see_or_decide_and_expired_decision_is_rejected(): void
    {
        $booking = $this->paidBooking();
        $other = $this->user('doctor');
        DB::table('doctors')->insert(['user_id' => $other->id, 'specialty_id' => $this->specialtyId,
            'name' => 'Bác sĩ khác giả', 'city' => 'TP.HCM', 'consultation_fee' => 200000]);
        Sanctum::actingAs($other);
        $this->getJson('/api/doctor-bookings/'.$booking->id)->assertForbidden();
        $this->getJson('/api/doctor/bookings?status=pending_approval')->assertOk()->assertJsonCount(0, 'data.items');
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/reject', ['version' => $booking->version, 'reason' => 'Bận'])->assertForbidden();
        Sanctum::actingAs($this->doctorUser);
        $this->travelTo($booking->approval_expires_at);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/reject', ['version' => $booking->version, 'reason' => 'Bận'])->assertStatus(409);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/approve', ['version' => $booking->version])->assertStatus(409);
    }

    public function test_rejection_requires_reason_and_calls_refund_once_with_rollback_on_failure(): void
    {
        $booking = $this->paidBooking();
        Sanctum::actingAs($this->doctorUser);
        $url = '/api/doctor/bookings/'.$booking->id.'/reject';
        $this->postJson($url, ['version' => $booking->version])->assertStatus(422);
        $this->mock(BookingRefund::class)->shouldReceive('requestFor')->once()->andThrow(new RuntimeException('test failure'));
        $payload = ['version' => $booking->version, 'reason' => 'Nghỉ giả lập'];
        $this->postJson($url, $payload)->assertStatus(500);
        $this->assertSame(BookingStatus::PENDING_APPROVAL, $booking->fresh()->status);
        $this->assertSame(1, Slot::findOrFail($booking->slot_id)->booked_count);
        $this->mock(BookingRefund::class)->shouldReceive('requestFor')->once()->withArgs(
            fn ($b, $event, $actor) => $b->status === BookingStatus::REJECTED
                && $event === BookingEvent::T06 && $actor->id === $this->doctorUser->id);
        $this->postJson($url, $payload)->assertOk()->assertJsonPath('data.status', 'rejected');
        $this->assertSame(0, Slot::findOrFail($booking->slot_id)->booked_count);
        $this->postJson($url, $payload)->assertStatus(409);
    }

    public function test_early_cancel_at_exactly_24_hours_and_reschedule_create_independent_bookings(): void
    {
        $booking = $this->confirmedBooking($this->slot('2030-01-02', '08:00:00'));
        Sanctum::actingAs($this->patient);
        $this->mock(BookingRefund::class)->shouldReceive('requestFor')->once()->withArgs(
            fn ($b, $event, $actor) => $b->status === BookingStatus::CANCELLED && $event === BookingEvent::T10
                && $actor->id === $this->patient->id);
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', [
            'version' => $booking->version, 'reason' => 'Đổi lịch giả lập',
        ])->assertOk();
        $this->assertSame('cancelled', DB::table('tickets')->where('booking_id', $booking->id)->value('status'));
        $this->assertSame(0, Slot::findOrFail($booking->slot_id)->booked_count);
        $new = $this->postJson('/api/doctor-bookings', $this->payload($this->slot('2030-01-03'), 'reschedule'))
            ->assertOk()->assertJsonPath('data.payment.total_amount', 220000);
        $this->assertNotSame($booking->id, $new->json('data.id'));
        $this->assertSame(BookingStatus::CANCELLED, $booking->fresh()->status);
    }

    public function test_patient_cannot_cancel_under_24_hours_but_doctor_emergency_blocks_slot(): void
    {
        $booking = $this->confirmedBooking($this->slot('2030-01-02', '07:59:00'));
        // Resolve a refund adapter so the cancellation policy itself is exercised.
        $this->mock(BookingRefund::class)->shouldReceive('requestFor')->once()->withArgs(
            fn ($b, $event, $actor) => $event === BookingEvent::T10 && $actor->id === $this->doctorUser->id);
        Sanctum::actingAs($this->patient);
        $payload = ['version' => $booking->version, 'reason' => 'Nghỉ giả lập'];
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', $payload)->assertStatus(422);
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', $payload)->assertOk();
        $this->assertSame('blocked', Slot::findOrFail($booking->slot_id)->status);
        $this->assertSame(0, Slot::findOrFail($booking->slot_id)->booked_count);
        $this->assertSame('cancelled', DB::table('tickets')->where('booking_id', $booking->id)->value('status'));
    }

    public function test_unpaid_cancel_needs_no_refund_and_foreign_patient_cannot_read(): void
    {
        $booking = $this->createBooking();
        Sanctum::actingAs($this->user('patient'));
        $this->getJson('/api/doctor-bookings/'.$booking->id)->assertForbidden();
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', [
            'version' => $booking->version, 'reason' => 'Huỷ giả lập',
        ])->assertOk()->assertJsonPath('data.payment.status', 'cancelled');
        $this->assertSame(0, Slot::findOrFail($booking->slot_id)->booked_count);
    }

    private function bindCreation(): void
    {
        $this->mock(PatientSnapshot::class)->shouldReceive('makePatientSnapshot')->andReturn([
            'full_name' => 'Bệnh nhân giả', 'identity_card_number' => '********8901', 'phone' => '******0000',
        ]);
        $this->mock(BookingPayment::class)->shouldReceive('ensurePendingPayment')->andReturnNull();
    }

    private function createBooking(?Slot $slot = null): Booking
    {
        $this->bindCreation();
        Sanctum::actingAs($this->patient);
        $response = $this->postJson('/api/doctor-bookings', $this->payload($slot ?? $this->slot(), bin2hex(random_bytes(6))))->assertOk();

        return Booking::findOrFail($response->json('data.id'));
    }

    private function paidBooking(?Slot $slot = null): Booking
    {
        $booking = $this->createBooking($slot);
        // Test setup substitutes for Khôi's callback; it is not an E2E gateway test.
        DB::table('payments')->where('booking_id', $booking->id)->update(['status' => 'paid', 'received_amount' => 220000]);

        return app(BookingStateMachine::class)->apply($booking, BookingEvent::T02, 'system');
    }

    private function confirmedBooking(?Slot $slot = null): Booking
    {
        $booking = app(BookingStateMachine::class)->apply($this->paidBooking($slot), BookingEvent::T05, $this->doctorUser);
        // Current main issues the real ticket inside T05; do not insert another.
        $this->assertDatabaseHas('tickets', ['booking_id' => $booking->id, 'status' => 'issued']);

        return $booking;
    }

    private function payload(Slot $slot, string $key = 'request'): array
    {
        return ['doctor_id' => $this->doctorId, 'slot_id' => $slot->id,
            'patient_profile_id' => $this->profileId, 'request_key' => $key];
    }

    private function slot(string $date = '2030-01-02', string $start = '09:00:00'): Slot
    {
        return Slot::create(['owner_type' => 'doctor', 'owner_id' => $this->doctorId,
            'specialty_id' => $this->specialtyId, 'work_date' => $date, 'start_time' => $start,
            'end_time' => CarbonImmutable::parse($date.' '.$start)->addMinutes(30)->format('H:i:s'),
            'capacity' => 1, 'booked_count' => 0, 'status' => 'available']);
    }

    private function user(string $role): User
    {
        return User::create(['name' => 'Tài khoản giả', 'email' => bin2hex(random_bytes(8)).'@example.test',
            'password' => 'test-only-password', 'role' => $role, 'status' => 'active']);
    }

    private function profile(User $user, ?string $identity = '012345678901'): int
    {
        $id = DB::table('patient_profiles')->insertGetId([
            'user_id' => $user->id, 'full_name' => 'Bệnh nhân giả', 'dob' => '2000-01-01',
            'gender' => 'other', 'relationship' => 'self', 'identity_card_number' => $identity,
        ]);
        DB::table('patient_consents')->insert(['user_id' => $user->id, 'patient_profile_id' => $id,
            'policy_version' => 'test', 'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);

        return $id;
    }
}
