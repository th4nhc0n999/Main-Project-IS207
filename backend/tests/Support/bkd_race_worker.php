<?php

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\PatientSnapshot;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Models\Booking;
use App\Models\User;
use App\Services\Bkd\DoctorBookingService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (env('RUN_BKD_MYSQL_TESTS') !== '1' || DB::connection()->getDriverName() !== 'mysql'
    || ! str_ends_with(DB::connection()->getDatabaseName(), '_test')) {
    exit(2);
}

// Test adapters only. These are never registered in application providers.
$app->instance(PatientSnapshot::class, new class implements PatientSnapshot
{
    public function makePatientSnapshot(object $profile): array
    {
        return ['full_name' => 'Race test patient'];
    }
});
$app->instance(BookingPayment::class, new class implements BookingPayment
{
    public function ensurePendingPayment(Booking $booking): void
    {
        if (DB::table('payments')->where('booking_id', $booking->id)->count() !== 1) {
            throw new RuntimeException('Expected one existing payment.');
        }
    }
});

$payload = json_decode($argv[1], true, 512, JSON_THROW_ON_ERROR);
$barrier = $payload['barrier'];
file_put_contents($barrier.'-'.$payload['worker'].'-ready', 'ready');
$deadline = microtime(true) + 15;
while (! file_exists($barrier.'-release') && microtime(true) < $deadline) {
    usleep(10000);
}
if (! file_exists($barrier.'-release')) {
    exit(3);
}

try {
    $booking = app(DoctorBookingService::class)->create(User::findOrFail($payload['user_id']), $payload['booking']);
    echo json_encode(['result' => 'booked', 'booking_id' => $booking->id], JSON_THROW_ON_ERROR);
} catch (SlotUnavailableException $e) {
    echo json_encode(['result' => 'unavailable', 'code' => $e->errorCode()], JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    fwrite(STDERR, $e::class);
    exit(1);
}
