<?php

namespace Tests\Feature\Bkd;

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\BookingRefund;
use App\Contracts\Bkd\BookingTicket;
use App\Contracts\Bkd\PatientSnapshot;
use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\User;
use App\Services\Bkd\Adapters\BookingPaymentAdapter;
use App\Services\Bkd\Adapters\BookingRefundAdapter;
use App\Services\Bkd\Adapters\BookingTicketAdapter;
use App\Services\Bkd\Adapters\PatientSnapshotAdapter;
use App\Services\PatientProfileService;
use App\Services\PaymentGatewayService;
use App\Support\Bkd\SensitiveData;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** No mocks, stubs or substitutions for the four BKD contracts or real services. */
class RealServiceIntegrationTest extends TestCase
{
    private User $patient;

    private User $doctorUser;

    private int $doctorId;

    private PatientProfile $profile;

    private Slot $slot;

    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (env('RUN_BKD_MYSQL_TESTS') !== '1') {
            $this->markTestSkipped('Requires RUN_BKD_MYSQL_TESTS=1 on a migrated MySQL test database.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        DB::beginTransaction();
        $this->transactionStarted = true;
        $this->travelTo(now()->setDate(2030, 1, 1)->setTime(8, 0));
        config(['medsi.qr_secret' => str_repeat('integration-test-', 3)]);
        Http::preventStrayRequests();
        $suffix = bin2hex(random_bytes(4));
        $this->patient = User::create(['name' => 'Synthetic integration patient',
            'email' => 'patient-'.$suffix.'@example.test', 'password' => 'test-only', 'role' => 'patient', 'status' => 'active']);
        $this->doctorUser = User::create(['name' => 'Synthetic integration doctor',
            'email' => 'doctor-'.$suffix.'@example.test', 'password' => 'test-only', 'role' => 'doctor', 'status' => 'active']);
        $specialty = DB::table('specialties')->insertGetId([
            'code' => 'I'.$suffix, 'name' => 'Integration specialty', 'slug' => 'integration-'.$suffix,
        ]);
        $this->doctorId = DB::table('doctors')->insertGetId(['user_id' => $this->doctorUser->id,
            'specialty_id' => $specialty, 'name' => 'Synthetic doctor', 'city' => 'Test', 'consultation_fee' => 200000]);
        $this->profile = PatientProfile::create(['user_id' => $this->patient->id,
            'full_name' => 'Synthetic child', 'dob' => '2020-01-01', 'gender' => 'other', 'relationship' => 'Con',
            'phone' => '0900000001', 'identity_card_number' => '000000000001',
            'health_insurance_code' => 'GD0000000000001', 'guardian_name' => 'Synthetic guardian',
            'guardian_phone' => '0900000002', 'guardian_relationship' => 'parent']);
        DB::table('patient_consents')->insert(['user_id' => $this->patient->id,
            'patient_profile_id' => $this->profile->id, 'policy_version' => 'integration-test',
            'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);
        $this->slot = Slot::create(['owner_type' => 'doctor', 'owner_id' => $this->doctorId,
            'specialty_id' => $specialty, 'work_date' => '2030-01-04',
            'start_time' => '10:00:00', 'end_time' => '10:30:00',
            'capacity' => 1, 'booked_count' => 0, 'status' => 'available']);
    }

    protected function tearDown(): void
    {
        if ($this->transactionStarted) {
            DB::rollBack();
            $this->travelBack();
        }
        parent::tearDown();
    }

    public function test_all_contracts_bind_to_real_adapters(): void
    {
        $this->assertInstanceOf(PatientSnapshotAdapter::class, app(PatientSnapshot::class));
        $this->assertInstanceOf(BookingPaymentAdapter::class, app(BookingPayment::class));
        $this->assertInstanceOf(BookingRefundAdapter::class, app(BookingRefund::class));
        $this->assertInstanceOf(BookingTicketAdapter::class, app(BookingTicket::class));
    }

    public function test_t01_stores_hieu_snapshot_with_masked_guardian_and_one_pending_payment(): void
    {
        $raw = app(PatientProfileService::class)->makePatientSnapshot($this->profile);
        $prepared = app(PatientSnapshot::class)->makePatientSnapshot($this->profile);
        $booking = $this->createBooking();

        $this->assertEquals($prepared, $booking->fresh()->patient_snapshot);
        foreach (['full_name', 'dob', 'gender', 'relationship', 'guardian_name', 'guardian_relationship'] as $key) {
            $this->assertSame($raw[$key], $booking->patient_snapshot[$key]);
        }
        foreach (['phone', 'identity_card_number', 'health_insurance_code', 'guardian_phone'] as $key) {
            $this->assertTrue(SensitiveData::isMaskedIdentifier($booking->patient_snapshot[$key], $key === 'health_insurance_code'));
            $this->assertNotSame($this->profile->$key, $booking->patient_snapshot[$key]);
        }
        $this->assertArrayNotHasKey('captured_at', $booking->patient_snapshot);
        $this->assertArrayNotHasKey('profile_id', $booking->patient_snapshot);
        app(BookingPayment::class)->ensurePendingPayment($booking);
        $this->assertSame(1, DB::table('payments')->where('booking_id', $booking->id)->count());
        $payment = DB::table('payments')->where('booking_id', $booking->id)->first();
        $this->assertSame('pending', $payment->status);
        $this->assertSame(220000, (int) $payment->total_amount);
        $this->assertSame(0, DB::table('payment_transactions')->where('payment_id', $payment->id)->count());
        Http::assertNothingSent();
    }

    public function test_t05_issues_exactly_one_real_ticket_even_when_adapter_repeats(): void
    {
        $booking = $this->approve($this->paidBooking());
        $ticket = DB::table('tickets')->where('booking_id', $booking->id)->first();
        $this->assertSame('issued', $ticket->status);
        $this->assertNotEmpty($ticket->qr_token);
        app(BookingTicket::class)->issueFor($booking);
        $this->assertSame(1, DB::table('tickets')->where('booking_id', $booking->id)->count());
        $this->assertSame($ticket->queue_seq, DB::table('tickets')->where('booking_id', $booking->id)->value('queue_seq'));
    }

    public function test_t06_requests_one_full_refund_without_marking_it_succeeded(): void
    {
        $booking = $this->paidBooking();
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/reject', [
            'version' => $booking->version, 'reason' => 'Synthetic refusal',
        ])->assertOk()->assertJsonPath('data.status', 'rejected');
        app(BookingRefund::class)->requestFor($booking->fresh(), BookingEvent::T06, $this->doctorUser);
        $this->assertRefund($booking, 200000, 20000, 'doctor_rejected');
        $this->assertSame(0, $this->slot->fresh()->booked_count);
    }

    public function test_t08_patient_cancellation_requests_only_exam_fee(): void
    {
        $booking = $this->paidBooking();
        $this->cancel($booking, $this->patient);
        $this->assertRefund($booking, 200000, 0, 'early_cancellation');
    }

    public function test_t10_early_patient_cancellation_cancels_ticket_and_refunds_200000(): void
    {
        $booking = $this->approve($this->paidBooking());
        $this->cancel($booking, $this->patient);
        $this->assertRefund($booking, 200000, 0, 'early_cancellation');
        $this->assertDatabaseHas('tickets', ['booking_id' => $booking->id, 'status' => 'cancelled']);
        $this->assertSame(0, $this->slot->fresh()->booked_count);
    }

    public function test_t10_doctor_emergency_refunds_both_fees_and_blocks_the_slot(): void
    {
        $booking = $this->approve($this->paidBooking());
        $this->cancel($booking, $this->doctorUser);
        $this->assertRefund($booking, 200000, 20000, 'doctor_unavailable');
        $this->assertSame('blocked', $this->slot->fresh()->status);
        $this->assertSame(0, $this->slot->fresh()->booked_count);
        $this->assertDatabaseHas('tickets', ['booking_id' => $booking->id, 'status' => 'cancelled']);
    }

    public function test_real_payment_service_error_rolls_back_booking_count_payment_and_audit(): void
    {
        $before = $this->effects();
        config(['medsi.service_fee_amount' => -1]);
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/doctor-bookings', $this->payload())->assertStatus(422);
        $this->assertSame($before, $this->effects());
    }

    public function test_real_ticket_signing_error_rolls_back_approval_ticket_and_audit(): void
    {
        $this->assertTrue(class_exists(JWT::class), 'Install the locked JWT dependency before exercising ticket signing.');
        $booking = $this->paidBooking();
        $before = $this->effects();
        config(['medsi.qr_secret' => 'invalid-short-secret']);
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/approve', ['version' => $booking->version])->assertStatus(500);
        $this->assertSame('pending_approval', $booking->fresh()->status->value);
        $this->assertSame($booking->version, $booking->fresh()->version);
        $this->assertSame($before, $this->effects());
    }

    public function test_real_refund_service_error_rolls_back_rejection_release_and_audit(): void
    {
        $booking = $this->paidBooking();
        // Reserve one synthetic đồng already refunded: the full request must fail.
        DB::table('payments')->where('booking_id', $booking->id)->update(['refunded_amount' => 1]);
        $before = $this->effects();
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/reject', [
            'version' => $booking->version, 'reason' => 'Synthetic refusal',
        ])->assertStatus(422);
        $this->assertSame('pending_approval', $booking->fresh()->status->value);
        $this->assertSame($booking->version, $booking->fresh()->version);
        $this->assertSame($before, $this->effects());
    }

    private function payload(): array
    {
        return ['doctor_id' => $this->doctorId, 'slot_id' => $this->slot->id,
            'patient_profile_id' => $this->profile->id, 'request_key' => 'real-integration'];
    }

    private function createBooking(): Booking
    {
        Sanctum::actingAs($this->patient);
        $response = $this->postJson('/api/doctor-bookings', $this->payload())->assertOk();

        return Booking::findOrFail($response->json('data.id'));
    }

    private function paidBooking(): Booking
    {
        $booking = $this->createBooking();
        $gateway = app(PaymentGatewayService::class);
        $transaction = $gateway->start($booking->id, 'qr_pay', $this->patient);
        $gateway->callback($booking->id, $transaction->transaction_code, 220000, 'success');

        return $booking->fresh();
    }

    private function approve(Booking $booking): Booking
    {
        $this->assertTrue(class_exists(JWT::class), 'Install the locked JWT dependency before issuing real tickets.');
        Sanctum::actingAs($this->doctorUser);
        $this->postJson('/api/doctor/bookings/'.$booking->id.'/approve', ['version' => $booking->version])
            ->assertOk()->assertJsonPath('data.status', 'confirmed');

        return $booking->fresh();
    }

    private function cancel(Booking $booking, User $actor): void
    {
        Sanctum::actingAs($actor);
        $this->postJson('/api/doctor-bookings/'.$booking->id.'/cancel', [
            'version' => $booking->version, 'reason' => 'Synthetic cancellation',
        ])->assertOk()->assertJsonPath('data.status', 'cancelled');
    }

    private function assertRefund(Booking $booking, int $exam, int $service, string $policy): void
    {
        $this->assertSame(1, DB::table('refunds')->where('booking_id', $booking->id)->count());
        $refund = DB::table('refunds')->where('booking_id', $booking->id)->first();
        $this->assertSame('requested', $refund->status);
        $this->assertSame($policy, $refund->policy_case);
        $this->assertSame($exam, (int) $refund->exam_fee_refunded);
        $this->assertSame($service, (int) $refund->service_fee_refunded);
        $this->assertSame($exam + $service, (int) $refund->amount);
        $payment = DB::table('payments')->where('booking_id', $booking->id)->first();
        $this->assertSame(0, (int) $payment->refunded_amount);
        $this->assertSame('paid', $payment->status);
    }

    private function effects(): array
    {
        return ['booking_count' => Booking::where('user_id', $this->patient->id)->count(),
            'payment_count' => DB::table('payments')->count(), 'ticket_count' => DB::table('tickets')->count(),
            'refund_count' => DB::table('refunds')->count(), 'audit_count' => DB::table('audit_logs')->count(),
            'booked_count' => $this->slot->fresh()->booked_count, 'slot_status' => $this->slot->fresh()->status];
    }
}
