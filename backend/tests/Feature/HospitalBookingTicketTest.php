<?php

namespace Tests\Feature;

use App\Enums\BookingEvent;
use App\Enums\TicketStatus;
use App\Enums\UserStatus;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\Ticket;
use App\Models\User;
use App\Services\BookingStateMachine;
use App\Services\TicketQrService;
use App\Services\TicketService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HospitalBookingTicketTest extends TestCase
{
    private int $hospital;

    private int $specialty;

    private int $exam;

    private int $profile;

    private User $patient;

    private Slot $slot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName(), 'Use a dedicated migrated MySQL test database.');
        DB::beginTransaction();
        $this->travelTo(now()->setDate(2026, 11, 5)->setTime(8, 0));
        config(['app.key' => 'test-only-application-key-with-32-bytes', 'medsi.qr_secret' => str_repeat('test', 8)]);
        $stamp = ['created_at' => now(), 'updated_at' => now()];
        $this->hospital = DB::table('hospitals')->insertGetId([...$stamp, 'name' => 'Test Hospital', 'address' => 'Test address', 'city' => 'Test city']);
        $this->specialty = DB::table('specialties')->insertGetId([...$stamp, 'code' => 'CK03', 'name' => 'Test Specialty', 'slug' => (string) Str::uuid(), 'default_instructions' => 'Arrive 15 minutes early.']);
        $this->exam = DB::table('exam_types')->insertGetId([...$stamp, 'hospital_id' => $this->hospital, 'specialty_id' => $this->specialty, 'name' => 'Test Exam', 'price' => 200000]);
        $this->patient = $this->user('patient');
        $this->profile = $this->profile($this->patient);
        $this->slot = $this->slot();
    }

    protected function tearDown(): void
    {
        DB::rollBack();
        $this->travelBack();
        parent::tearDown();
    }

    public function test_hospital_booking_holds_once_masks_snapshot_and_confirms_with_one_ticket(): void
    {
        Sanctum::actingAs($this->patient);
        $payload = $this->payload();
        $created = $this->postJson('/api/hospital-bookings', $payload)->assertCreated()
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.payment.total_amount', 220000)
            ->assertJsonPath('data.patient_snapshot.phone', '*******789')
            ->assertJsonPath('data.patient_snapshot.identity_card_number', '*********012')
            ->assertJsonPath('data.ticket', null);
        $id = $created->json('data.id');
        $this->postJson('/api/hospital-bookings', $payload)->assertOk()->assertJsonPath('data.id', $id);
        $this->assertSame(1, $this->slot->refresh()->booked_count);
        $this->assertSame(1, DB::table('payments')->where('booking_id', $id)->count());
        $this->assertSame(now()->addMinutes(15)->timestamp, Booking::findOrFail($id)->hold_expires_at->timestamp);

        $booking = $this->confirm(Booking::findOrFail($id));
        $this->assertSame('confirmed', $booking->status->value);
        $this->assertNull($booking->doctor_id);
        $this->assertNull($booking->approval_expires_at);
        $ticket = app(TicketService::class)->issue($booking);
        $this->assertSame('CK03-001', $ticket->queue_number);
        $this->assertMatchesRegularExpression('/^TKT-20261105-[A-Z0-9]{6}$/', $ticket->ticket_code);
        $this->assertSame('Arrive 15 minutes early.', $ticket->instructions);
        $this->assertLessThanOrEqual(512, strlen($ticket->qr_token));
        $this->assertSame($ticket->ticket_code, app(TicketQrService::class)->verify($ticket->qr_token));
        $this->assertSame(1, Ticket::where('booking_id', $id)->count());
        $this->assertSame(1, $this->slot->refresh()->booked_count);
    }

    public function test_hospital_specialties_have_independent_shift_capacity_and_admin_creation(): void
    {
        $otherSpecialty = DB::table('specialties')->insertGetId(['code' => 'CK04', 'name' => 'Other', 'slug' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
        Sanctum::actingAs($this->user('admin'));
        $data = ['specialty_id' => $otherSpecialty, 'work_date' => $this->slot->work_date->toDateString(), 'start_time' => '09:00', 'end_time' => '12:00', 'capacity' => 3];
        $this->postJson('/api/hospitals/'.$this->hospital.'/slots', $data)->assertCreated();
        $this->postJson('/api/hospitals/'.$this->hospital.'/slots', $data)->assertUnprocessable();
        $this->confirm($this->book());
        $this->getJson('/api/hospitals/'.$this->hospital.'/slots?specialty_id='.$otherSpecialty)
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.remaining_capacity', 3);
        $this->getJson('/api/hospitals/'.$this->hospital.'/slots?specialty_id='.$this->specialty)->assertOk()->assertJsonCount(0, 'data');
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/hospitals/'.$this->hospital.'/slots', $data)->assertForbidden();
    }

    public function test_full_or_blocked_slot_returns_se001_and_cannot_change_capacity(): void
    {
        Sanctum::actingAs($this->patient);
        $this->slot->update(['status' => 'blocked']);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertConflict()->assertJsonPath('code', 'SE001');
        $this->slot->update(['status' => 'full', 'booked_count' => 1]);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertConflict()->assertJsonPath('code', 'SE001');
        $this->assertSame(1, $this->slot->refresh()->booked_count);
    }

    public function test_booking_rejects_foreign_profile_wrong_specialty_missing_consent_and_price_input(): void
    {
        Sanctum::actingAs($this->patient);
        $payload = $this->payload();
        $foreignProfile = $this->profile($this->user('patient'));
        $this->postJson('/api/hospital-bookings', [...$payload, 'patient_profile_id' => $foreignProfile])->assertUnprocessable();
        $this->postJson('/api/hospital-bookings', [...$payload, 'total_amount' => 1])->assertUnprocessable();
        $other = DB::table('specialties')->insertGetId(['code' => 'CK05', 'name' => 'Other', 'slug' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
        $this->postJson('/api/hospital-bookings', [...$payload, 'specialty_id' => $other])->assertUnprocessable();
        DB::table('patient_consents')->where('patient_profile_id', $this->profile)->update(['revoked_at' => now()]);
        $this->postJson('/api/hospital-bookings', $payload)->assertUnprocessable();
        $this->assertSame(0, $this->slot->refresh()->booked_count);
    }

    public function test_booking_window_and_exam_specialty_are_enforced(): void
    {
        Sanctum::actingAs($this->patient);
        $this->slot->update(['work_date' => today()->toDateString()]);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertUnprocessable();
        $this->slot->update(['work_date' => today()->addDays(31)->toDateString()]);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertUnprocessable();
        $this->slot->update(['work_date' => today()->addDays(2)->toDateString()]);
        DB::table('exam_types')->where('id', $this->exam)->update(['hospital_id' => DB::table('hospitals')->insertGetId(['name' => 'Other Hospital', 'address' => 'Test', 'city' => 'Test'])]);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertUnprocessable();
    }

    public function test_request_key_cannot_be_reused_for_another_exam(): void
    {
        Sanctum::actingAs($this->patient);
        $payload = $this->payload();
        $this->postJson('/api/hospital-bookings', $payload)->assertCreated();
        $otherExam = DB::table('exam_types')->insertGetId(['hospital_id' => $this->hospital, 'specialty_id' => $this->specialty, 'name' => 'Other Exam', 'price' => 300000]);
        $this->postJson('/api/hospital-bookings', [...$payload, 'exam_type_id' => $otherExam])->assertUnprocessable();
    }

    public function test_confirmation_and_ticket_roll_back_together_if_signing_fails(): void
    {
        $booking = $this->book();
        config(['medsi.qr_secret' => 'too-short']);
        try {
            $this->confirm($booking);
            $this->fail('An invalid signing key must not issue a ticket.');
        } catch (\LogicException) {
            $this->assertSame('pending_payment', $booking->refresh()->status->value);
            $this->assertFalse(Ticket::where('booking_id', $booking->id)->exists());
        }
    }

    public function test_doctor_approval_issues_shared_ticket_and_staff_can_check_in(): void
    {
        $doctorUser = $this->user('doctor');
        $doctor = DB::table('doctors')->insertGetId(['user_id' => $doctorUser->id, 'hospital_id' => $this->hospital, 'specialty_id' => $this->specialty, 'name' => 'Test Doctor', 'city' => 'Test', 'consultation_fee' => 200000]);
        $slot = $this->slot(['owner_type' => 'doctor', 'owner_id' => $doctor]);
        $booking = app(BookingStateMachine::class)->apply(new Booking([
            'user_id' => $this->patient->id, 'patient_profile_id' => $this->profile,
            'slot_id' => $slot->id, 'booking_type' => 'doctor', 'doctor_id' => $doctor,
        ]), BookingEvent::T01, $this->patient);
        $booking = $this->confirm($booking, BookingEvent::T02);
        $this->assertFalse(Ticket::where('booking_id', $booking->id)->exists());
        $booking = app(BookingStateMachine::class)->apply($booking, BookingEvent::T05, $doctorUser);
        $ticket = Ticket::where('booking_id', $booking->id)->firstOrFail();
        $this->travelTo($slot->work_date->setTime(9, 0));
        Sanctum::actingAs($this->user('staff', $this->hospital));
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertOk();
        $this->assertSame('checked_in', $booking->refresh()->status->value);
        $this->assertSame(1, $slot->refresh()->booked_count);
    }

    public function test_check_in_is_scoped_atomic_and_repeated_scan_has_no_effect(): void
    {
        $booking = $this->confirm($this->book());
        $ticket = Ticket::where('booking_id', $booking->id)->firstOrFail();
        $this->travelTo($this->slot->work_date->setTime(9, 0));
        $otherHospital = DB::table('hospitals')->insertGetId(['name' => 'Other', 'address' => 'Test', 'city' => 'Test']);
        Sanctum::actingAs($this->user('staff', $otherHospital));
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertForbidden();
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertForbidden();
        Sanctum::actingAs($this->user('staff', $this->hospital));
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertOk()->assertJsonPath('data.status', 'checked_in')->assertJsonMissingPath('data.qr_token');
        $version = $booking->refresh()->version;
        $time = $ticket->refresh()->check_in_at->timestamp;
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertConflict()->assertJsonPath('code', 'EX-TKT-02');
        $this->assertSame($version, $booking->refresh()->version);
        $this->assertSame($time, $ticket->refresh()->check_in_at->timestamp);
        $this->assertSame(1, DB::table('audit_logs')->where('entity_id', $booking->id)->where('action', 'T09')->count());
        $this->assertSame(1, $this->slot->refresh()->booked_count);
    }

    public function test_check_in_rejects_tampered_wrong_date_expired_and_cancelled_tickets(): void
    {
        $booking = $this->confirm($this->book());
        $ticket = Ticket::where('booking_id', $booking->id)->firstOrFail();
        Sanctum::actingAs($this->user('admin'));
        $this->postJson('/api/tickets/check-in', ['qr_token' => 'invalid.jwt.signature'])->assertUnprocessable()->assertJsonPath('code', 'EX-TKT-01');
        $parts = explode('.', $ticket->qr_token);
        $parts[1] = rtrim(strtr(base64_encode('{"sub":"tampered"}'), '+/', '-_'), '=');
        $this->postJson('/api/tickets/check-in', ['qr_token' => implode('.', $parts)])->assertUnprocessable();
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertUnprocessable()->assertJsonPath('code', 'EX-TKT-02');
        app(BookingStateMachine::class)->apply($booking, BookingEvent::T10, $this->patient, ['reason' => 'Test cancellation']);
        $this->travelTo($this->slot->work_date->setTime(9, 0));
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertUnprocessable();
        $this->travelTo($this->slot->work_date->addDay()->setTime(9, 0));
        $this->postJson('/api/tickets/check-in', ['qr_token' => $ticket->qr_token])->assertUnprocessable()->assertJsonPath('code', 'EX-TKT-01');
        $this->assertSame(TicketStatus::CANCELLED, $ticket->refresh()->status);
    }

    public function test_queue_spans_shifts_never_reuses_cancelled_numbers_and_resets_by_day(): void
    {
        $first = $this->confirm($this->book());
        app(BookingStateMachine::class)->apply($first, BookingEvent::T10, $this->patient, ['reason' => 'Test cancellation']);
        $this->slot = $this->slot(['start_time' => '13:00', 'end_time' => '16:00']);
        $second = $this->confirm($this->book());
        $this->assertSame('CK03-002', Ticket::where('booking_id', $second->id)->value('queue_number'));
        $this->slot = $this->slot(['work_date' => today()->addDays(3)->toDateString()]);
        $third = $this->confirm($this->book());
        $this->assertSame('CK03-001', Ticket::where('booking_id', $third->id)->value('queue_number'));
    }

    public function test_history_search_tabs_export_and_ticket_access_do_not_leak_other_users(): void
    {
        $booking = $this->confirm($this->book());
        $ticket = Ticket::where('booking_id', $booking->id)->firstOrFail();
        Sanctum::actingAs($this->patient);
        $this->getJson('/api/me/bookings?tab=upcoming&q='.$ticket->ticket_code)->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.ticket.qr_token');
        $this->getJson('/api/me/bookings?tab=closed')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/bookings/'.$booking->id.'/ticket')->assertOk()->assertJsonPath('data.ticket.ticket_code', $ticket->ticket_code);
        $png = $this->get('/api/bookings/'.$booking->id.'/ticket/qr.png')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertStringStartsWith("\x89PNG\r\n\x1a\n", $png->getContent());
        $this->assertSame(400, getimagesizefromstring($png->getContent())[0] - 48);
        Sanctum::actingAs($this->user('patient'));
        $this->getJson('/api/me/bookings?q='.$ticket->ticket_code)->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/bookings/'.$booking->id.'/ticket')->assertNotFound();
        $this->getJson('/api/bookings/'.$booking->id.'/ticket/qr.png')->assertNotFound();
        Sanctum::actingAs($this->user('staff', $this->hospital));
        $this->getJson('/api/me/bookings')->assertForbidden();
    }

    public function test_disabled_accounts_cannot_access_booking_or_ticket_apis(): void
    {
        $this->patient->update(['status' => UserStatus::DISABLED]);
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/hospital-bookings', $this->payload())->assertForbidden();
        $this->getJson('/api/me/bookings')->assertForbidden();
    }

    public function test_guest_cannot_create_bookings_view_history_or_scan_tickets(): void
    {
        $this->postJson('/api/hospital-bookings', $this->payload())->assertUnauthorized();
        $this->getJson('/api/me/bookings')->assertUnauthorized();
        $this->getJson('/api/bookings/1/ticket')->assertUnauthorized();
        $this->postJson('/api/tickets/check-in', ['qr_token' => 'test'])->assertUnauthorized();
    }

    public function test_patient_can_cancel_pending_payment_and_confirmed_booking_before_24_hours(): void
    {
        $pending = $this->book();
        $this->assertSame('pending_payment', $pending->status->value);
        $this->assertSame(1, $this->slot->fresh()->booked_count);

        Sanctum::actingAs($this->patient);
        $this->postJson('/api/hospital-bookings/'.$pending->id.'/cancel', [
            'reason' => 'Đổi kế hoạch cá nhân',
        ])->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->assertSame('cancelled', $pending->fresh()->status->value);
        $this->assertSame(0, $this->slot->fresh()->booked_count);

        $confirmed = $this->confirm($this->book());
        $this->assertSame('confirmed', $confirmed->status->value);
        $ticket = Ticket::where('booking_id', $confirmed->id)->firstOrFail();
        $this->assertSame(TicketStatus::ISSUED, $ticket->status);

        $this->travelTo(now()->setDate(2026, 11, 5)->setTime(10, 0));

        $res = $this->postJson('/api/hospital-bookings/'.$confirmed->id.'/cancel', [
            'reason' => 'Bận việc đột xuất',
        ])->assertOk();

        $res->assertJsonPath('data.status', 'cancelled');
        $this->assertSame('cancelled', $confirmed->fresh()->status->value);
        $this->assertSame(TicketStatus::CANCELLED, $ticket->fresh()->status);
        $this->assertSame(0, $this->slot->fresh()->booked_count);

        $this->assertDatabaseHas('refunds', [
            'booking_id' => $confirmed->id,
            'exam_fee_refunded' => 200000,
            'service_fee_refunded' => 0,
            'status' => 'requested',
        ]);
    }

    public function test_patient_cannot_cancel_confirmed_booking_under_24_hours(): void
    {
        $confirmed = $this->confirm($this->book());

        $this->travelTo(now()->setDate(2026, 11, 6)->setTime(12, 0));

        Sanctum::actingAs($this->patient);
        $this->postJson('/api/hospital-bookings/'.$confirmed->id.'/cancel', [
            'reason' => 'Muốn hủy cận giờ',
        ])->assertStatus(422)
          ->assertJsonFragment(['message' => 'Lịch còn dưới 24 giờ; vui lòng liên hệ Admin.']);

        $this->assertSame('confirmed', $confirmed->fresh()->status->value);
    }

    private function user(string $role, ?int $hospital = null): User
    {
        return User::create(['name' => 'Synthetic '.$role, 'email' => Str::uuid().'@example.test', 'password' => 'test-password', 'role' => $role, 'status' => 'active', 'hospital_id' => $hospital]);
    }

    private function profile(User $user): int
    {
        $id = DB::table('patient_profiles')->insertGetId(['user_id' => $user->id, 'full_name' => 'Synthetic Patient', 'dob' => '1990-01-01', 'gender' => 'other', 'relationship' => 'self', 'phone' => '0123456789', 'identity_card_number' => '123456789012']);
        DB::table('patient_consents')->insert(['user_id' => $user->id, 'patient_profile_id' => $id, 'policy_version' => 'test-v1', 'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);

        return $id;
    }

    private function slot(array $overrides = []): Slot
    {
        return Slot::create([...['owner_type' => 'hospital', 'owner_id' => $this->hospital, 'specialty_id' => $this->specialty, 'work_date' => today()->addDays(2)->toDateString(), 'start_time' => '09:00', 'end_time' => '12:00', 'capacity' => 1, 'booked_count' => 0, 'status' => 'available'], ...$overrides]);
    }

    private function payload(): array
    {
        return ['hospital_id' => $this->hospital, 'specialty_id' => $this->specialty, 'exam_type_id' => $this->exam, 'slot_id' => $this->slot->id, 'patient_profile_id' => $this->profile, 'request_key' => (string) Str::uuid()];
    }

    private function book(): Booking
    {
        return app(BookingStateMachine::class)->apply(new Booking([...$this->payload(), 'user_id' => $this->patient->id, 'booking_type' => 'hospital']), BookingEvent::T01, $this->patient);
    }

    private function confirm(Booking $booking, BookingEvent $event = BookingEvent::T02H): Booking
    {
        // Payment belongs to S4-60/61; this fixture models its trusted success hook.
        DB::table('payments')->where('booking_id', $booking->id)->update(['status' => 'paid', 'received_amount' => 220000, 'paid_at' => now(), 'method' => 'qr_pay']);

        return app(BookingStateMachine::class)->apply($booking, $event, 'gateway');
    }
}
