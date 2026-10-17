<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\Payment\SlotHoldExpiredException;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\Payment\SlotHoldService;
use Carbon\Carbon;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PaymentService
{
    private const PAYABLE_BOOKING_STATUS = 'pending_payment';

    public function __construct(private readonly SlotHoldService $holds = new SlotHoldService) {}

    public function calculateInvoice(int|string|Booking $bookingParam, int $userId): array
    {
        $result = DB::transaction(function () use ($bookingParam, $userId) {
            $booking = $this->lockBooking($bookingParam, $userId);
            if ($this->holds->releaseIfOverdue($booking)) {
                return new SlotHoldExpiredException;
            }

            return $this->buildInvoice($booking);
        }, 3);

        if ($result instanceof SlotHoldExpiredException) {
            throw $result;
        }

        return $result;
    }

    public function getPayment(int $paymentId, int $userId): Payment
    {
        return DB::transaction(function () use ($paymentId, $userId) {
            $payment = $this->resolvePayment($paymentId, $userId);
            $booking = $this->lockBooking($payment->booking_id, $userId);
            $this->holds->releaseIfOverdue($booking);

            return $this->loadPaymentDetails($payment);
        }, 3);
    }

    /** Compatibility entry point for the existing Payment scheduler; counts released holds. */
    public function expireOverduePayments(): int
    {
        return $this->holds->expireOverdueHolds();
    }

    public function createPayment(
        int|string|Booking $bookingParam,
        PaymentMethod|string $methodParam,
        int $userId
    ): Payment {
        $method = $this->resolveMethod($methodParam);
        $result = DB::transaction(function () use ($bookingParam, $method, $userId) {
            $booking = $this->lockBooking($bookingParam, $userId);
            if ($this->holds->releaseIfOverdue($booking)) {
                return new SlotHoldExpiredException;
            }

            $payment = Payment::query()->where('booking_id', $booking->id)->lockForUpdate()->first();
            if ($payment?->isPaid()) {
                throw new DomainException('Đơn đặt khám này đã được thanh toán thành công.');
            }
            if ($payment?->isRefunded()) {
                throw new DomainException('Giao dịch đã hoàn tiền và không thể sử dụng lại.');
            }

            $invoice = $this->buildInvoice($booking);
            if ($payment?->isPending() && $payment->method !== $method) {
                throw new DomainException('Vui lòng hủy giao dịch hiện tại trước khi đổi phương thức.');
            }
            if ($payment?->isPending()) {
                // M5 creates a pending payment before handing off to Payment.
                // Align its fees with the invoice without changing its method or reference.
                $this->applyInvoice($payment, $invoice);
                $payment->save();

                return $this->loadPaymentDetails($payment);
            }
            if ($payment && ! $payment->status->canTransitionTo(PaymentStatus::PENDING)) {
                throw new DomainException('Trạng thái giao dịch hiện tại không cho phép thử thanh toán lại.');
            }

            $payment ??= new Payment(['booking_id' => $booking->id]);
            $this->applyInvoice($payment, $invoice);
            $payment->fill([
                'method' => $method,
                'status' => PaymentStatus::PENDING,
                // This is the successful simulated gateway reference, not a checkout ID.
                'transaction_code' => null,
                'paid_at' => null,
            ])->save();

            return $this->loadPaymentDetails($payment);
        }, 3);

        if ($result instanceof SlotHoldExpiredException) {
            throw $result;
        }

        return $result;
    }

    /** Legacy API compatibility: confirmation delegates to the single processing path. */
    public function confirmPayment(int|Payment $paymentParam, int $userId, ?string $otp = null): Payment
    {
        return $this->processPayment($paymentParam, $userId, $otp);
    }

    /**
     * Simulated gateway. Slot -> booking -> payment locks serialize processing and expiration.
     * Expected failures are returned from the transaction and thrown after its commit.
     */
    public function processPayment(int|Payment $paymentParam, int $userId, ?string $otp = null): Payment
    {
        $result = DB::transaction(function () use ($paymentParam, $userId, $otp) {
            $reference = $this->resolvePayment($paymentParam, $userId);
            $booking = $this->lockBooking($reference->booking_id, $userId);
            $payment = $this->resolvePayment($reference->id, $userId, true);

            if ($payment->isPaid()) {
                return $this->loadPaymentDetails($payment);
            }
            if ($payment->isExpired() || $this->holds->releaseIfOverdue($booking)) {
                return new SlotHoldExpiredException;
            }
            if (! $payment->isPending()) {
                throw new DomainException('Trạng thái giao dịch hiện tại không cho phép xác nhận thanh toán.');
            }

            $invoice = $this->buildInvoice($booking);
            if (! config('payment.demo_gateway.enabled', false)) {
                throw new DomainException('Gateway giả lập chưa được bật.');
            }
            if (! $this->isDemoOtpValid($payment, $otp)) {
                $payment->status = PaymentStatus::FAILED;
                $payment->save();

                return new DomainException('Mã xác thực OTP không chính xác hoặc đã hết hạn.');
            }

            $this->applyInvoice($payment, $invoice);
            $payment->status = PaymentStatus::PAID;
            $payment->transaction_code = $this->generateTransactionCode();
            $payment->paid_at = now();
            $payment->save();

            $booking->status = 'confirmed';
            $booking->slot_hold_expires_at = null;
            $booking->save();
            // M5 already counted this hold; successful payment must NOT increment slot again.

            return $this->loadPaymentDetails($payment);
        }, 3);

        if ($result instanceof \Throwable) {
            throw $result;
        }

        return $result;
    }

    public function markAsFailed(int|Payment $paymentParam, int $userId, ?string $reason = null): Payment
    {
        return $this->finishPendingPayment($paymentParam, $userId, PaymentStatus::FAILED);
    }

    /** Cancelling payment permits another attempt until the original booking deadline. */
    public function cancelPayment(int|Payment $paymentParam, int $userId): Payment
    {
        return $this->finishPendingPayment($paymentParam, $userId, PaymentStatus::CANCELLED);
    }

    private function finishPendingPayment(int|Payment $paymentParam, int $userId, PaymentStatus $status): Payment
    {
        return DB::transaction(function () use ($paymentParam, $userId, $status) {
            $reference = $this->resolvePayment($paymentParam, $userId);
            $booking = $this->lockBooking($reference->booking_id, $userId);
            $payment = $this->resolvePayment($reference->id, $userId, true);
            if ($this->holds->releaseIfOverdue($booking)) {
                return $this->loadPaymentDetails($payment);
            }
            if ($payment->status === $status) {
                return $this->loadPaymentDetails($payment);
            }
            if (! $payment->status->canTransitionTo($status)) {
                throw new DomainException('Giao dịch đã hoàn tất, không thể đánh dấu thất bại hoặc hủy.');
            }
            $payment->status = $status;
            $payment->save();

            return $this->loadPaymentDetails($payment);
        }, 3);
    }

    public function expirePayment(int|Payment $paymentParam, int $userId): Payment
    {
        return DB::transaction(function () use ($paymentParam, $userId) {
            $reference = $this->resolvePayment($paymentParam, $userId);
            $booking = $this->lockBooking($reference->booking_id, $userId);
            $payment = $this->resolvePayment($reference->id, $userId, true);
            if ($payment->isExpired()) {
                $this->holds->releaseIfOverdue($booking);

                return $this->loadPaymentDetails($payment);
            }
            if (! $payment->isPending()) {
                throw new DomainException('Chỉ có thể đánh dấu hết hạn giao dịch đang chờ thanh toán.');
            }
            if (! $this->holds->releaseIfOverdue($booking)) {
                throw new DomainException('Đơn đặt khám không hợp lệ hoặc vẫn còn trong thời gian thanh toán.');
            }

            return $this->loadPaymentDetails($payment);
        }, 3);
    }

    private function lockBooking(int|string|Booking $bookingParam, int $userId): Booking
    {
        $query = Booking::query()->where('user_id', $userId);
        if ($bookingParam instanceof Booking) {
            $query->whereKey($bookingParam->getKey());
        } elseif (is_int($bookingParam) || ctype_digit($bookingParam)) {
            $query->whereKey($bookingParam);
        } else {
            $query->where('code', $bookingParam);
        }

        $booking = $this->holds->lockBooking($query->firstOrFail());
        // Recheck ownership after acquiring the lock, never trust a caller's model attributes.
        if ((int) $booking->user_id !== $userId) {
            throw new ModelNotFoundException;
        }

        return $booking->loadMissing(['hospital', 'examType', 'patientProfile']);
    }

    private function applyInvoice(Payment $payment, array $invoice): void
    {
        $payment->fill([
            'exam_fee' => $invoice['fees']['exam_fee'],
            'service_fee' => $invoice['fees']['service_fee'],
            'total_amount' => $invoice['fees']['total_amount'],
        ]);
    }

    private function buildInvoice(Booking $booking): array
    {
        $this->ensureBookingCanBePaid($booking);

        $examFee = $this->toVndAmount($booking->examType->price, 'Giá khám');
        $serviceFee = $this->toVndAmount(config('payment.service_fee', 10000), 'Phí dịch vụ');
        $totalAmount = $examFee + $serviceFee;

        return [
            'booking_id' => $booking->id,
            'booking_code' => $booking->code,
            'booking_type' => $booking->booking_type,
            'booking_status' => $booking->status,
            'patient' => [
                'id' => $booking->patientProfile->id,
                'full_name' => $booking->patientProfile->full_name,
                'phone' => $booking->patientProfile->phone,
                'gender' => $booking->patientProfile->gender,
                'dob' => $booking->patientProfile->dob?->format('d/m/Y'),
            ],
            'hospital' => [
                'id' => $booking->hospital->id,
                'name' => $booking->hospital->name,
                'address' => $booking->hospital->address,
                'city' => $booking->hospital->city,
                'hotline' => $booking->hospital->hotline,
            ],
            'exam_type' => [
                'id' => $booking->examType->id,
                'name' => $booking->examType->name,
                'price' => $examFee,
            ],
            'schedule' => [
                'work_date' => $booking->slot->work_date?->format('d/m/Y'),
                'time_slot' => substr((string) $booking->slot->start_time, 0, 5)
                    .' - '.substr((string) $booking->slot->end_time, 0, 5),
            ],
            'fees' => [
                'exam_fee' => $examFee,
                'service_fee' => $serviceFee,
                'total_amount' => $totalAmount,
                'currency' => 'VND',
                'formatted' => [
                    'exam_fee' => $this->formatVnd($examFee),
                    'service_fee' => $this->formatVnd($serviceFee),
                    'total_amount' => $this->formatVnd($totalAmount),
                ],
            ],
            'slot_hold_expires_at' => $booking->slot_hold_expires_at?->toIso8601String(),
            'is_hold_expired' => false,
            'available_methods' => array_map(
                static fn (PaymentMethod $method): array => [
                    'id' => $method->value,
                    'name' => $method->label(),
                    'description' => $method->description(),
                ],
                PaymentMethod::cases()
            ),
        ];
    }

    private function ensureBookingCanBePaid(Booking $booking): void
    {
        if ($booking->booking_type !== 'hospital') {
            throw new InvalidArgumentException('Chỉ đơn đặt khám bệnh viện mới hỗ trợ thanh toán trực tuyến.');
        }

        if ($booking->status === 'cancelled' && $booking->slot_hold_expires_at?->isPast()) {
            throw new SlotHoldExpiredException;
        }

        if ($booking->status !== self::PAYABLE_BOOKING_STATUS) {
            throw new DomainException('Trạng thái đơn đặt khám hiện tại không cho phép thanh toán.');
        }

        if ($booking->slot_hold_expires_at === null) {
            throw new DomainException('Đơn đặt khám không có thời hạn giữ chỗ hợp lệ.');
        }

        if (Carbon::now()->greaterThanOrEqualTo($booking->slot_hold_expires_at)) {
            throw new SlotHoldExpiredException;
        }

        if (! $booking->patientProfile) {
            throw new DomainException('Không tìm thấy hồ sơ bệnh nhân của đơn đặt khám.');
        }

        if (! $booking->hospital) {
            throw new DomainException('Không tìm thấy cơ sở khám của đơn đặt khám.');
        }

        if (! $booking->examType) {
            throw new DomainException('Không tìm thấy loại hình khám hoặc giá khám.');
        }

        if (! $booking->slot) {
            throw new DomainException('Không tìm thấy khung giờ khám của đơn đặt khám.');
        }

        if ((int) $booking->patientProfile->user_id !== (int) $booking->user_id) {
            throw new DomainException('Hồ sơ bệnh nhân không thuộc chủ đơn đặt khám.');
        }

        if ($booking->slot->status === 'blocked' || $booking->slot->booked_count < 1) {
            throw new DomainException('Khung giờ khám bị khóa hoặc không còn giữ chỗ.');
        }

        $startsAt = $booking->slot->work_date?->copy()->setTimeFromTimeString($booking->slot->start_time);
        if ($startsAt === null || now()->greaterThanOrEqualTo($startsAt)) {
            throw new DomainException('Khung giờ khám đã bắt đầu hoặc không hợp lệ.');
        }

        if ((int) $booking->examType->hospital_id !== (int) $booking->hospital_id) {
            throw new DomainException('Loại hình khám không thuộc cơ sở khám đã chọn.');
        }

        if (
            $booking->slot->owner_type !== 'hospital'
            || (int) $booking->slot->owner_id !== (int) $booking->hospital_id
        ) {
            throw new DomainException('Khung giờ khám không thuộc cơ sở khám đã chọn.');
        }
    }

    private function resolveMethod(PaymentMethod|string $method): PaymentMethod
    {
        if ($method instanceof PaymentMethod) {
            return $method;
        }

        return PaymentMethod::tryFrom($method)
            ?? throw new InvalidArgumentException('Phương thức thanh toán không hợp lệ.');
    }

    private function isDemoOtpValid(Payment $payment, ?string $otp): bool
    {
        if (! $payment->method->requiresOtp()) {
            return true;
        }

        $expectedOtp = (string) config('payment.demo_gateway.otp', '');

        return $otp !== null
            && $expectedOtp !== ''
            && hash_equals($expectedOtp, $otp);
    }

    private function resolvePayment(
        int|Payment $paymentParam,
        int $userId,
        bool $lockForUpdate = false
    ): Payment {
        $paymentId = $paymentParam instanceof Payment ? $paymentParam->getKey() : $paymentParam;
        $query = Payment::query()
            ->with('booking')
            ->whereHas('booking', static fn ($bookingQuery) => $bookingQuery->where('user_id', $userId));

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->findOrFail($paymentId);
    }

    private function loadPaymentDetails(Payment $payment): Payment
    {
        $payment->refresh();
        $payment->load(['booking.hospital', 'booking.patientProfile', 'booking.examType']);

        return $payment;
    }

    private function toVndAmount(mixed $value, string $field): int
    {
        if (! is_numeric($value)) {
            throw new DomainException("{$field} không hợp lệ.");
        }

        $amount = (float) $value;
        if ($amount < 0 || abs($amount - round($amount)) > 0.00001) {
            throw new DomainException("{$field} phải là số nguyên VNĐ không âm.");
        }

        return (int) round($amount);
    }

    private function formatVnd(int $amount): string
    {
        return number_format($amount, 0, ',', '.').' đ';
    }

    private function generateTransactionCode(): string
    {
        return Str::upper('TXN'.now()->format('YmdHisv').Str::random(6));
    }
}
