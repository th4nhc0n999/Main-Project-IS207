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
use App\Services\PaymentService;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Booking $booking;

    private PaymentService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payment.service_fee' => 10000,
            'payment.demo_gateway.enabled' => true,
            'payment.demo_gateway.otp' => '123456',
        ]);

        $this->user = $this->createUser('owner@example.com');
        $hospital = Hospital::create([
            'name' => 'Bệnh viện kiểm thử',
            'description' => 'Cơ sở dùng trong test.',
            'address' => '1 Đường Kiểm Thử',
            'city' => 'TP. Hồ Chí Minh',
            'hotline' => '19000000',
        ]);
        $patient = PatientProfile::create([
            'user_id' => $this->user->id,
            'full_name' => 'Nguyễn Văn Test',
            'dob' => '2000-01-01',
            'gender' => 'male',
            'phone' => '0900000000',
            'relationship' => 'Bản thân',
        ]);
        $examType = ExamType::create([
            'hospital_id' => $hospital->id,
            'name' => 'Khám tổng quát',
            'price' => 150000,
        ]);
        $slot = Slot::create([
            'owner_type' => 'hospital',
            'owner_id' => $hospital->id,
            'work_date' => now()->addDay()->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '08:30:00',
            'capacity' => 10,
            'booked_count' => 1,
            'status' => 'available',
        ]);
        $this->booking = Booking::create([
            'code' => 'BKTEST0001',
            'user_id' => $this->user->id,
            'patient_profile_id' => $patient->id,
            'booking_type' => 'hospital',
            'hospital_id' => $hospital->id,
            'exam_type_id' => $examType->id,
            'slot_id' => $slot->id,
            'status' => 'pending_payment',
            'slot_hold_expires_at' => now()->addMinutes(15),
        ]);

        $this->service = app(PaymentService::class);
    }

    public function test_it_calculates_invoice_from_database_values(): void
    {
        $invoice = $this->service->calculateInvoice($this->booking->id, $this->user->id);

        $this->assertSame(150000, $invoice['fees']['exam_fee']);
        $this->assertSame(10000, $invoice['fees']['service_fee']);
        $this->assertSame(160000, $invoice['fees']['total_amount']);
        $this->assertCount(5, $invoice['available_methods']);
        $this->assertFalse($invoice['is_hold_expired']);
    }

    public function test_it_does_not_expose_another_users_booking(): void
    {
        $otherUser = $this->createUser('other@example.com');

        $this->expectException(ModelNotFoundException::class);
        $this->service->calculateInvoice($this->booking->id, $otherUser->id);
    }

    public function test_it_rejects_an_expired_slot_hold(): void
    {
        $this->booking->update(['slot_hold_expires_at' => now()->subSecond()]);

        $this->expectException(SlotHoldExpiredException::class);
        $this->expectExceptionMessage('Thời gian giữ slot khám đã hết');
        $this->service->calculateInvoice($this->booking->id, $this->user->id);
    }

    public function test_it_never_overwrites_a_paid_payment(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::ATM,
            $this->user->id
        );
        $payment->update([
            'status' => PaymentStatus::PAID,
            'paid_at' => now(),
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('đã được thanh toán thành công');
        $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::MOMO,
            $this->user->id
        );
    }

    public function test_confirming_payment_is_idempotent_and_confirms_booking(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::QR_PAY,
            $this->user->id
        );

        $confirmed = $this->service->confirmPayment($payment, $this->user->id);
        $confirmedAgain = $this->service->confirmPayment($confirmed, $this->user->id);

        $this->assertSame(PaymentStatus::PAID, $confirmedAgain->status);
        $this->assertNotEmpty($confirmedAgain->transaction_code);
        $this->assertSame('confirmed', $this->booking->fresh()->status);
        $this->assertNull($this->booking->fresh()->slot_hold_expires_at);
    }

    public function test_paid_payment_cannot_be_marked_as_failed(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::CREDIT_CARD,
            $this->user->id
        );
        $confirmed = $this->service->confirmPayment($payment, $this->user->id, '123456');

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('không thể đánh dấu thất bại');
        $this->service->markAsFailed($confirmed, $this->user->id);
    }

    public function test_it_rechecks_slot_expiration_when_confirming_payment(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::QR_PAY,
            $this->user->id
        );
        $this->booking->update(['slot_hold_expires_at' => now()->subSecond()]);

        $this->expectException(SlotHoldExpiredException::class);
        $this->expectExceptionMessage('Không thể xác nhận thanh toán');
        $this->service->confirmPayment($payment, $this->user->id);
    }

    public function test_card_payment_requires_the_configured_demo_otp(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::ATM,
            $this->user->id
        );

        try {
            $this->service->confirmPayment($payment, $this->user->id, '000000');
            $this->fail('Invalid OTP should not confirm the payment.');
        } catch (DomainException $exception) {
            $this->assertStringContainsString('OTP không chính xác', $exception->getMessage());
        }

        $this->assertSame(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertSame('pending_payment', $this->booking->fresh()->status);
    }

    public function test_creating_the_same_pending_payment_is_idempotent(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::MOMO,
            $this->user->id
        );

        $samePayment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::MOMO,
            $this->user->id
        );

        $this->assertSame($payment->id, $samePayment->id);
        $this->assertSame($payment->transaction_code, $samePayment->transaction_code);
    }

    public function test_pending_payment_must_be_cancelled_before_changing_method(): void
    {
        $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::QR_PAY,
            $this->user->id
        );

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Vui lòng hủy giao dịch hiện tại');

        $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::MOMO,
            $this->user->id
        );
    }

    public function test_payment_cannot_expire_before_slot_hold_deadline(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::QR_PAY,
            $this->user->id
        );

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('vẫn còn trong thời gian thanh toán');

        $this->service->expirePayment($payment, $this->user->id);
    }

    public function test_failed_payment_can_be_retried_without_overwriting_a_paid_payment(): void
    {
        $payment = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::ATM,
            $this->user->id
        );
        $this->service->markAsFailed($payment, $this->user->id, 'Sai OTP');

        $retried = $this->service->createPayment(
            $this->booking->id,
            PaymentMethod::MOMO,
            $this->user->id
        );

        $this->assertSame($payment->id, $retried->id);
        $this->assertSame(PaymentStatus::PENDING, $retried->status);
        $this->assertSame(PaymentMethod::MOMO, $retried->method);
    }

    public function test_payment_routes_require_authentication(): void
    {
        $this->postJson('/api/payments/calculate-invoice', [
            'booking_id' => $this->booking->id,
        ])->assertUnauthorized();
    }

    private function createUser(string $email): User
    {
        return User::create([
            'name' => 'Payment Test User',
            'email' => $email,
            'password' => 'password',
        ]);
    }
}
