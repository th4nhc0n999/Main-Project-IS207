<?php

namespace Tests\Unit;

use App\Enums\BookingEvent;
use App\Enums\BookingStatus;
use App\Exceptions\Booking\InvalidBookingTransitionException;
use App\Services\BookingStateMachine;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class BookingStateMachineTest extends TestCase
{
    #[DataProvider('validTransitions')]
    public function test_event_transitions_to_expected_status(
        ?string $current,
        string $event,
        string $expected
    ): void {
        $machine = new BookingStateMachine;

        $result = $machine->transitionFor(
            $current,
            BookingEvent::from($event)
        );

        $this->assertSame(BookingStatus::from($expected), $result);
    }

    public static function validTransitions(): array
    {
        return [
            'T01 create' => [null, 'T01', 'pending_payment'],
            'T02 doctor paid' => ['pending_payment', 'T02', 'pending_approval'],
            'T02H hospital paid' => ['pending_payment', 'T02H', 'confirmed'],
            'T03 hold expires' => ['pending_payment', 'T03', 'expired'],
            'T04 unpaid cancel' => ['pending_payment', 'T04', 'cancelled'],
            'T05 doctor approves' => ['pending_approval', 'T05', 'confirmed'],
            'T06 doctor rejects' => ['pending_approval', 'T06', 'rejected'],
            'T07 approval expires' => ['pending_approval', 'T07', 'expired'],
            'T08 approval cancel' => ['pending_approval', 'T08', 'cancelled'],
            'T09 check in' => ['confirmed', 'T09', 'checked_in'],
            'T10 confirmed cancel' => ['confirmed', 'T10', 'cancelled'],
            'T11 no show' => ['confirmed', 'T11', 'no_show'],
            'T12 complete' => ['checked_in', 'T12', 'completed'],
            'T13 cancel after check in' => ['checked_in', 'T13', 'cancelled'],
            'T14 payment failure retains hold' => ['pending_payment', 'T14', 'pending_payment'],
            'T15 duplicate callback is a no-op' => ['confirmed', 'T15', 'confirmed'],
            'T16 late or duplicate payment is a no-op' => ['expired', 'T16', 'expired'],
        ];
    }

    #[DataProvider('invalidTransitions')]
    public function test_event_rejects_an_invalid_source_status(?string $current, string $event): void
    {
        $this->expectException(InvalidBookingTransitionException::class);

        (new BookingStateMachine)->transitionFor($current, BookingEvent::from($event));
    }

    public static function invalidTransitions(): array
    {
        return [
            'T01 cannot reuse an existing booking' => ['pending_payment', 'T01'],
            'T02 only starts from payment pending' => ['confirmed', 'T02'],
            'T02H only starts from payment pending' => ['expired', 'T02H'],
            'T03 only expires a payment hold' => ['pending_approval', 'T03'],
            'T04 only cancels an unpaid booking' => ['confirmed', 'T04'],
            'T05 only approves pending review' => ['confirmed', 'T05'],
            'T06 only rejects pending review' => ['pending_payment', 'T06'],
            'T07 only expires pending review' => ['confirmed', 'T07'],
            'T08 only cancels pending review' => ['confirmed', 'T08'],
            'T09 only checks in confirmed booking' => ['pending_approval', 'T09'],
            'T10 only cancels confirmed booking' => ['checked_in', 'T10'],
            'T11 only marks confirmed booking no-show' => ['checked_in', 'T11'],
            'T12 only completes checked-in booking' => ['confirmed', 'T12'],
            'T13 only cancels checked-in booking' => ['confirmed', 'T13'],
            'T14 cannot fail a closed booking' => ['expired', 'T14'],
            'T16 cannot apply to pending payment' => ['pending_payment', 'T16'],
        ];
    }
}