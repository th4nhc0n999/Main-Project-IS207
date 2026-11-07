<?php

use App\Enums\BookingEvent;
use App\Exceptions\Booking\InvalidBookingTransitionException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Exceptions\Booking\TicketException;
use App\Models\Booking;
use App\Models\User;
use App\Services\BookingStateMachine;
use App\Services\TicketService;
use Carbon\Carbon;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$payload = json_decode($argv[1], true, flags: JSON_THROW_ON_ERROR);
config(['medsi.qr_secret' => str_repeat('race', 8)]);
Carbon::setTestNow($payload['now']);
touch($payload['barrier'].'-'.$payload['worker'].'-ready');
$deadline = microtime(true) + 15;
while (! file_exists($payload['barrier'].'-release')) {
    if (microtime(true) > $deadline) {
        throw new RuntimeException('Race barrier timed out.');
    }
    usleep(10000);
}

try {
    $actor = User::findOrFail($payload['user_id']);
    if (in_array($payload['mode'], ['booking', 'request_key'], true)) {
        $booking = app(BookingStateMachine::class)->apply(new Booking($payload['booking']), BookingEvent::T01, $actor);
        echo json_encode(['result' => 'booked', 'id' => $booking->id]);
    } elseif ($payload['mode'] === 'issue') {
        $booking = app(BookingStateMachine::class)->apply(Booking::findOrFail($payload['booking_id']), BookingEvent::T02H, 'gateway');
        echo json_encode(['result' => 'issued', 'id' => $booking->id]);
    } else {
        $ticket = app(TicketService::class)->checkIn($payload['token'], $actor);
        echo json_encode(['result' => 'checked_in', 'id' => $ticket->id]);
    }
} catch (SlotUnavailableException $exception) {
    echo json_encode(['result' => 'unavailable', 'code' => $exception->errorCode()]);
} catch (TicketException $exception) {
    echo json_encode(['result' => 'duplicate', 'code' => $exception->errorCode]);
} catch (InvalidBookingTransitionException $exception) {
    echo json_encode(['result' => 'conflict']);
} catch (Throwable $exception) {
    fwrite(STDERR, $exception::class.': '.$exception->getMessage());
    exit(1);
}
