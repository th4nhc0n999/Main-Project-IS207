<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\Payment\SlotHoldExpiredException;
use App\Models\Booking;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\User;
use App\Services\BookingService;
use App\Services\PaymentService;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PaymentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Booking $booking;

    private PaymentService $payments;

    protected function setUp(): void
    {
        parent::setUp();
        $this->freezeTime();
        config(['payment.service_fee' => 10000, 'payment.demo_gateway.enabled' => true, 'payment.demo_gateway.otp' => '123456']);
        $this->user = User::factory()->create();
        $hospital = Hospital::factory()->create();
        $profile = PatientProfile::factory()->create(['user_id' => $this->user->id]);
        $exam = ExamType::factory()->for($hospital)->create(['price' => 150000]);
        $slot = Slot::factory()->forHospital($hospital, 1)->create([
            'work_date' => now()->addDay(), 'capacity' => 1, 'booked_count' => 0, 'status' => 'available',
        ]);
        // Exercise M5's real handoff, including its pre-created payment and reserved capacity.
        $this->booking = app(BookingService::class)->createHospitalBooking($this->user->id, [
            'patient_profile_id' => $profile->id, 'hospital_id' => $hospital->id,
            'exam_type_id' => $exam->id, 'slot_id' => $slot->id, 'payment_method' => 'qr_pay',
        ]);
        $this->payments = app(PaymentService::class);
    }

    public static function methods(): array
    {
        return array_map(fn ($method) => [$method->value], PaymentMethod::cases());
    }

    #[DataProvider('methods')]
    public function test_hospital_handoff_processes_all_methods_without_double_counting(string $method): void
    {
        $this->booking->payment->update(['method' => $method]);
        $invoice = $this->payments->calculateInvoice($this->booking->code, $this->user->id);
        $payment = $this->payments->createPayment($this->booking, $method, $this->user->id);
        $this->assertEquals($invoice['fees']['total_amount'], $payment->total_amount);
        $this->assertSame($this->booking->payment->id, $payment->id);
        $this->assertNull($payment->transaction_code);

        $paid = $this->payments->processPayment($payment, $this->user->id, '123456');
        $again = $this->payments->processPayment($paid, $this->user->id);
        $this->assertSame(PaymentStatus::PAID, $paid->status);
        $this->assertStringStartsWith('TXN', $paid->transaction_code);
        $this->assertSame($paid->transaction_code, $again->transaction_code);
        $this->assertTrue($paid->paid_at->equalTo($again->paid_at));
        $this->assertEquals(160000, $paid->total_amount);
        $this->assertSame('confirmed', $this->booking->fresh()->status);
        $this->assertNull($this->booking->fresh()->slot_hold_expires_at);
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
        $this->assertSame('full', $this->booking->slot->fresh()->status);
    }

    public function test_processing_m5_payment_directly_uses_invoice_fees(): void
    {
        $payment = $this->payments->processPayment($this->booking->payment, $this->user->id);
        $this->assertEquals(10000, $payment->service_fee);
        $this->assertEquals(160000, $payment->total_amount);
    }

    public function test_deadline_is_exclusive_and_releases_hold_exactly_once(): void
    {
        $this->travelTo($this->booking->slot_hold_expires_at);
        try {
            $this->payments->processPayment($this->booking->payment, $this->user->id);
            $this->fail('Expected hold expiration.');
        } catch (SlotHoldExpiredException $exception) {
            $this->assertSame(409, $exception->getStatusCode());
        }
        $this->assertSame(PaymentStatus::EXPIRED, $this->booking->payment->fresh()->status);
        $this->assertSame('cancelled', $this->booking->fresh()->status);
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
        $this->assertSame('available', $this->booking->slot->fresh()->status);
        $this->assertSame(0, $this->payments->expireOverduePayments());
        $this->payments->expirePayment($this->booking->payment, $this->user->id);
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
    }

    public function test_payment_just_before_deadline_succeeds_and_cleanup_does_not_release_it(): void
    {
        $this->travelTo($this->booking->slot_hold_expires_at->copy()->subSecond());
        $this->payments->processPayment($this->booking->payment, $this->user->id);
        $this->travel(2)->minutes();
        $this->assertSame(0, $this->payments->expireOverduePayments());
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
    }

    public static function unpaidStates(): array
    {
        return [['pending'], ['failed'], ['cancelled'], ['expired'], [null]];
    }

    #[DataProvider('unpaidStates')]
    public function test_cleanup_releases_holds_even_without_pending_payment(?string $status): void
    {
        if ($status === null) {
            $this->booking->payment->delete();
        } else {
            $this->booking->payment->update(['status' => $status]);
        }
        $this->travel(15)->minutes();
        $this->assertSame(1, $this->payments->expireOverduePayments());
        $this->assertSame(0, $this->payments->expireOverduePayments());
        $this->assertSame('cancelled', $this->booking->fresh()->status);
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
        if ($status !== null) {
            $this->assertSame($status === 'pending' ? 'expired' : $status, $this->booking->payment->fresh()->status->value);
        }
    }

    public function test_cleanup_preserves_blocked_slot_and_does_not_underflow(): void
    {
        $this->booking->slot->update(['status' => 'blocked', 'booked_count' => 0]);
        $this->travel(15)->minutes();
        $this->payments->expireOverduePayments();
        $this->assertSame('blocked', $this->booking->slot->fresh()->status);
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
    }

    public function test_missing_deadline_is_invalid_and_does_not_release_capacity(): void
    {
        $this->booking->update(['slot_hold_expires_at' => null]);
        try {
            $this->payments->expirePayment($this->booking->payment, $this->user->id);
            $this->fail('Null is not an elapsed deadline.');
        } catch (DomainException) {
            $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
        }
        $this->assertSame(0, $this->payments->expireOverduePayments());
        $this->expectException(DomainException::class);
        $this->payments->processPayment($this->booking->payment, $this->user->id);
    }

    public function test_cancellation_keeps_hold_for_retry_without_extending_deadline(): void
    {
        $deadline = $this->booking->slot_hold_expires_at->toISOString();
        $payment = $this->payments->cancelPayment($this->booking->payment, $this->user->id);
        $this->payments->cancelPayment($payment, $this->user->id);
        $this->assertSame(PaymentStatus::CANCELLED, $payment->status);
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
        $retried = $this->payments->createPayment($this->booking, 'momo', $this->user->id);
        $this->assertSame($payment->id, $retried->id);
        $this->assertSame($deadline, $this->booking->fresh()->slot_hold_expires_at->toISOString());
        $this->travel(15)->minutes();
        $this->payments->expireOverduePayments();
        $this->expectException(SlotHoldExpiredException::class);
        $this->payments->createPayment($this->booking, 'momo', $this->user->id);
    }

    #[DataProvider('methods')]
    public function test_disabled_simulator_blocks_every_method(string $method): void
    {
        config(['payment.demo_gateway.enabled' => false]);
        $this->booking->payment->update(['method' => $method]);
        try {
            $this->payments->processPayment($this->booking->payment, $this->user->id, '123456');
            $this->fail('Simulator must be explicitly enabled.');
        } catch (DomainException) {
            $this->assertSame(PaymentStatus::PENDING, $this->booking->payment->fresh()->status);
            $this->assertSame('pending_payment', $this->booking->fresh()->status);
        }
    }

    public function test_another_user_cannot_release_or_process_a_hold(): void
    {
        $other = User::factory()->create();
        $this->travel(15)->minutes();
        foreach (['processPayment', 'getPayment', 'expirePayment', 'cancelPayment'] as $method) {
            try {
                $this->payments->$method($this->booking->payment->id, $other->id);
                $this->fail('Foreign payment must not be accessible.');
            } catch (ModelNotFoundException) {
                $this->assertSame('pending_payment', $this->booking->fresh()->status);
            }
        }
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
    }

    public function test_stale_booking_model_cannot_bypass_expiration(): void
    {
        Booking::whereKey($this->booking->id)->update(['slot_hold_expires_at' => now()->subSecond()]);
        $this->expectException(SlotHoldExpiredException::class);
        $this->payments->createPayment($this->booking, 'qr_pay', $this->user->id);
    }

    public function test_process_api_envelope_alias_and_server_owned_amounts(): void
    {
        Sanctum::actingAs($this->user);
        $this->postJson('/api/payments/process', [
            'payment_id' => $this->booking->payment->id,
            'total_amount' => 1, 'transaction_code' => 'FORGED', 'status' => 'refunded',
        ])->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('errors', null)->assertJsonPath('data.status.code', 'paid')
            ->assertJsonPath('data.total_amount', 160000);
        $code = $this->booking->payment->fresh()->transaction_code;
        $this->assertNotSame('FORGED', $code);
        $this->postJson('/api/payments/confirm', ['payment_id' => $this->booking->payment->id])
            ->assertOk()->assertJsonPath('data.transaction_code', $code);
    }

    public function test_expired_api_response_and_database_changes(): void
    {
        Sanctum::actingAs($this->user);
        $this->travel(15)->minutes();
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])
            ->assertStatus(409)->assertJsonPath('success', false)
            ->assertJsonPath('errors', null)->assertJsonPath('data', null);
        $this->getJson('/api/payments/'.$this->booking->payment->id)
            ->assertOk()->assertJsonPath('data.status.code', 'expired');
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
    }

    public function test_payment_api_validates_input_and_authorization(): void
    {
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])->assertUnauthorized();
        Sanctum::actingAs($this->user);
        foreach (['/api/payments/create', '/api/payments/calculate-invoice'] as $endpoint) {
            foreach ([[1], true, -1, '1.5', '1e2', ''] as $invalid) {
                $this->postJson($endpoint, ['booking_id' => $invalid, 'method' => 'qr_pay'])
                    ->assertUnprocessable()->assertJsonValidationErrors('booking_id');
            }
        }
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id, 'otp' => 'abc'])
            ->assertUnprocessable()->assertJsonValidationErrors('otp');
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])
            ->assertNotFound()->assertJsonPath('success', false);
    }

    public function test_expired_hold_allows_m5_to_book_the_same_patient_and_slot_again(): void
    {
        $this->travel(15)->minutes();
        $this->payments->expireOverduePayments();
        $next = app(BookingService::class)->createHospitalBooking($this->user->id, [
            'patient_profile_id' => $this->booking->patient_profile_id,
            'hospital_id' => $this->booking->hospital_id,
            'exam_type_id' => $this->booking->exam_type_id,
            'slot_id' => $this->booking->slot_id,
        ]);
        $this->assertNotSame($this->booking->id, $next->id);
        $this->assertSame(1, $next->slot->booked_count);
        $this->assertSame('pending_payment', $next->status);
    }

    public function test_expired_hold_allows_another_patient_to_book_without_cron_job(): void
    {
        $this->travel(16)->minutes();
        // Do NOT call expireOverduePayments() - verify on-demand check on slot_hold_expires_at
        $otherUser = User::factory()->create();
        $otherProfile = PatientProfile::factory()->create(['user_id' => $otherUser->id]);

        $next = app(BookingService::class)->createHospitalBooking($otherUser->id, [
            'patient_profile_id' => $otherProfile->id,
            'hospital_id' => $this->booking->hospital_id,
            'exam_type_id' => $this->booking->exam_type_id,
            'slot_id' => $this->booking->slot_id,
        ]);

        $this->assertNotSame($this->booking->id, $next->id);
        $this->assertSame(1, $next->slot->fresh()->booked_count);
        $this->assertSame('pending_payment', $next->status);
        $this->assertSame('cancelled', $this->booking->fresh()->status);
    }

    public function test_cleanup_ignores_doctor_and_paid_or_refunded_bookings(): void
    {
        $this->travel(15)->minutes();
        foreach (['paid', 'refunded'] as $status) {
            $this->booking->payment->update(['status' => $status]);
            $this->assertSame(0, $this->payments->expireOverduePayments());
        }
        $this->booking->payment->update(['status' => 'pending']);
        $this->booking->update(['booking_type' => 'doctor']);
        $this->assertSame(0, $this->payments->expireOverduePayments());
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
    }

    public function test_process_refuses_blocked_slot_or_inconsistent_patient(): void
    {
        Sanctum::actingAs($this->user);
        $this->booking->slot->update(['status' => 'blocked']);
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])->assertStatus(409);
        $this->booking->slot->update(['status' => 'full']);
        $foreignProfile = PatientProfile::factory()->create();
        $this->booking->update(['patient_profile_id' => $foreignProfile->id]);
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])->assertStatus(409);
        $this->assertSame(PaymentStatus::PENDING, $this->booking->payment->fresh()->status);
    }

    public function test_failed_attempt_can_retry_without_extending_hold(): void
    {
        $this->booking->payment->update(['method' => 'atm']);
        $deadline = $this->booking->slot_hold_expires_at->toISOString();
        Sanctum::actingAs($this->user);
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id, 'otp' => '000000'])
            ->assertStatus(409);
        $this->assertSame(PaymentStatus::FAILED, $this->booking->payment->fresh()->status);
        $retry = $this->payments->createPayment($this->booking->id, 'atm', $this->user->id);
        $this->assertNull($retry->transaction_code);
        $this->payments->processPayment($retry, $this->user->id, '123456');
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
        $this->assertTrue(now()->lessThan($deadline));
    }

    public function test_booking_write_failure_rolls_back_payment_success(): void
    {
        $event = 'eloquent.updating: '.Booking::class;
        Event::listen($event, function (Booking $booking): void {
            if ($booking->status === 'confirmed') {
                throw new \RuntimeException('Simulated booking write failure');
            }
        });
        try {
            $this->payments->processPayment($this->booking->payment, $this->user->id);
            $this->fail('Expected write failure.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated booking write failure', $exception->getMessage());
        } finally {
            Event::forget($event);
        }
        $payment = $this->booking->payment->fresh();
        $this->assertSame(PaymentStatus::PENDING, $payment->status);
        $this->assertNull($payment->transaction_code);
        $this->assertNull($payment->paid_at);
        $this->assertSame('pending_payment', $this->booking->fresh()->status);
    }

    public function test_slot_write_failure_rolls_back_entire_expiration(): void
    {
        $this->travel(15)->minutes();
        $event = 'eloquent.updating: '.Slot::class;
        Event::listen($event, function (): void {
            throw new \RuntimeException('Simulated slot write failure');
        });
        try {
            $this->payments->expireOverduePayments();
            $this->fail('Expected write failure.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated slot write failure', $exception->getMessage());
        } finally {
            Event::forget($event);
        }
        $this->assertSame(PaymentStatus::PENDING, $this->booking->payment->fresh()->status);
        $this->assertSame('pending_payment', $this->booking->fresh()->status);
        $this->assertSame(1, $this->booking->slot->fresh()->booked_count);
    }

    public static function terminalStates(): array
    {
        return [['failed'], ['cancelled'], ['expired'], ['refunded']];
    }

    #[DataProvider('terminalStates')]
    public function test_non_pending_payment_cannot_be_processed_directly(string $status): void
    {
        $this->booking->payment->update(['status' => $status]);
        Sanctum::actingAs($this->user);
        $this->postJson('/api/payments/process', ['payment_id' => $this->booking->payment->id])->assertStatus(409);
        $this->assertSame($status, $this->booking->payment->fresh()->status->value);
        $this->assertSame('pending_payment', $this->booking->fresh()->status);
    }

    public function test_reading_overdue_payment_releases_hold_and_returns_expired(): void
    {
        $this->travel(15)->minutes();
        $payment = $this->payments->getPayment($this->booking->payment->id, $this->user->id);
        $this->assertSame(PaymentStatus::EXPIRED, $payment->status);
        $this->assertSame(0, $this->booking->slot->fresh()->booked_count);
        $this->assertSame('cancelled', $this->booking->fresh()->status);
    }

    public function test_api_rejects_unknown_method_and_accepts_booking_code(): void
    {
        Sanctum::actingAs($this->user);
        $this->postJson('/api/payments/create', ['booking_id' => $this->booking->id, 'method' => 'cash'])
            ->assertUnprocessable()->assertJsonValidationErrors('method');
        $this->postJson('/api/payments/calculate-invoice', ['booking_id' => $this->booking->code])
            ->assertOk()->assertJsonPath('data.booking_id', $this->booking->id)->assertJsonPath('errors', null);
        $this->postJson('/api/payments/create', ['booking_id' => $this->booking->code, 'method' => 'qr_pay'])
            ->assertCreated()->assertJsonPath('data.id', $this->booking->payment->id)
            ->assertJsonPath('data.total_amount', 160000);
    }
}
