<?php

namespace Tests\Unit;

use App\Enums\PaymentStatus;
use PHPUnit\Framework\TestCase;

class PaymentStatusTest extends TestCase
{
    public function test_pending_can_move_to_supported_processing_results(): void
    {
        $this->assertTrue(PaymentStatus::PENDING->canTransitionTo(PaymentStatus::PAID));
        $this->assertTrue(PaymentStatus::PENDING->canTransitionTo(PaymentStatus::FAILED));
        $this->assertTrue(PaymentStatus::PENDING->canTransitionTo(PaymentStatus::CANCELLED));
        $this->assertTrue(PaymentStatus::PENDING->canTransitionTo(PaymentStatus::EXPIRED));
        $this->assertFalse(PaymentStatus::PENDING->canTransitionTo(PaymentStatus::REFUNDED));
    }

    public function test_paid_can_only_become_refunded(): void
    {
        $this->assertTrue(PaymentStatus::PAID->canTransitionTo(PaymentStatus::REFUNDED));
        $this->assertFalse(PaymentStatus::PAID->canTransitionTo(PaymentStatus::PENDING));
        $this->assertFalse(PaymentStatus::PAID->canTransitionTo(PaymentStatus::FAILED));
    }

    public function test_failed_can_be_retried_as_pending(): void
    {
        $this->assertTrue(PaymentStatus::FAILED->canTransitionTo(PaymentStatus::PENDING));
        $this->assertFalse(PaymentStatus::FAILED->canTransitionTo(PaymentStatus::PAID));
    }

    public function test_cancelled_and_expired_payments_can_be_retried(): void
    {
        $this->assertTrue(PaymentStatus::CANCELLED->canTransitionTo(PaymentStatus::PENDING));
        $this->assertTrue(PaymentStatus::EXPIRED->canTransitionTo(PaymentStatus::PENDING));
        $this->assertFalse(PaymentStatus::CANCELLED->canTransitionTo(PaymentStatus::PAID));
        $this->assertFalse(PaymentStatus::EXPIRED->canTransitionTo(PaymentStatus::PAID));
    }

    public function test_final_statuses_are_identified(): void
    {
        $this->assertTrue(PaymentStatus::PAID->isFinal());
        $this->assertTrue(PaymentStatus::REFUNDED->isFinal());
        $this->assertFalse(PaymentStatus::PENDING->isFinal());
        $this->assertFalse(PaymentStatus::FAILED->isFinal());
        $this->assertFalse(PaymentStatus::CANCELLED->isFinal());
        $this->assertFalse(PaymentStatus::EXPIRED->isFinal());
    }
}
