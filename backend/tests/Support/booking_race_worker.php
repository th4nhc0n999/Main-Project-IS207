<?php

use App\Enums\BookingEvent;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Models\Booking;
use App\Models\User;
use App\Services\BookingStateMachine;
use Illuminate\Contracts\Console\Kernel;

require dirname(__DIR__, 2).'/vendor/autoload.php';

$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$payload = json_decode($argv[1] ?? '', true, 512, JSON_THROW_ON_ERROR);
$barrier = (string) $payload['barrier'];
$worker = (string) $payload['worker'];
file_put_contents($barrier.'-'.$worker.'-ready', 'ready');

$deadline = microtime(true) + 10;
while (! file_exists($barrier.'-release') && microtime(true) < $deadline) {
    usleep(10000);
}

if (! file_exists($barrier.'-release')) {
    fwrite(STDERR, 'Race barrier timed out.');
    exit(2);
}

try {
    $user = User::query()->findOrFail($payload['user_id']);
    $booking = new Booking([
        'user_id' => $user->id,
        'patient_profile_id' => $payload['profile_id'],
        'booking_type' => 'doctor',
        'doctor_id' => $payload['doctor_id'],
        'slot_id' => $payload['slot_id'],
        'patient_snapshot' => ['full_name' => 'Concurrency test'],
    ]);

    $saved = app(BookingStateMachine::class)->apply($booking, BookingEvent::T01, $user);
    echo json_encode(['result' => 'booked', 'booking_id' => $saved->id], JSON_THROW_ON_ERROR);
} catch (SlotUnavailableException $exception) {
    echo json_encode(['result' => 'unavailable', 'code' => $exception->errorCode()], JSON_THROW_ON_ERROR);
} catch (Throwable $exception) {
    fwrite(STDERR, $exception::class.': '.$exception->getMessage());
    exit(1);
}