<?php

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BookingConcurrencyTest extends TestCase
{
    public function test_only_one_request_claims_the_last_slot(): void
    {
        if (env('RUN_MYSQL_CONCURRENCY_TESTS') !== '1') {
            $this->markTestSkipped('Set RUN_MYSQL_CONCURRENCY_TESTS=1 to run the MySQL concurrency test.');
        }

        $connection = DB::connection();
        $database = (string) $connection->getDatabaseName();

        $this->assertSame('mysql', $connection->getDriverName());
        $this->assertStringEndsWith('_test', $database, 'Concurrency tests require a database ending in _test.');

        foreach (['users', 'patient_profiles', 'specialties', 'hospitals', 'doctors', 'slots', 'bookings', 'audit_logs'] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing {$table}; run migrations on the dedicated test database first.");
        }

        $engine = DB::selectOne(
            'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
            [$database, 'slots']
        );
        $this->assertSame('InnoDB', $engine?->ENGINE);

        $suffix = bin2hex(random_bytes(5));
        $specialtyId = null;
        $hospitalId = null;
        $doctorId = null;
        $slotId = null;
        $userIds = [];
        $profileIds = [];
        $barrier = sys_get_temp_dir().DIRECTORY_SEPARATOR.'medsi-race-'.$suffix;
        $processes = [];

        try {
            $specialtyId = DB::table('specialties')->insertGetId([
                'code' => 'T'.strtoupper(substr($suffix, 0, 7)),
                'name' => 'Concurrency Test',
                'slug' => 'concurrency-'.$suffix,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $hospitalId = DB::table('hospitals')->insertGetId([
                'name' => 'Concurrency Test Hospital',
                'address' => 'Test address',
                'city' => 'Ho Chi Minh City',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $doctorUserId = $this->createUser('doctor', 'doctor-'.$suffix.'@example.test', null);
            $userIds[] = $doctorUserId;
            $doctorId = DB::table('doctors')->insertGetId([
                'user_id' => $doctorUserId,
                'specialty_id' => $specialtyId,
                'hospital_id' => $hospitalId,
                'name' => 'Concurrency Doctor',
                'city' => 'Ho Chi Minh City',
                'consultation_fee' => 200000,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $slotId = DB::table('slots')->insertGetId([
                'owner_type' => 'doctor',
                'owner_id' => $doctorId,
                'specialty_id' => $specialtyId,
                'work_date' => CarbonImmutable::tomorrow()->toDateString(),
                'start_time' => '10:00:00',
                'end_time' => '10:30:00',
                'capacity' => 1,
                'booked_count' => 0,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            for ($index = 1; $index <= 2; $index++) {
                $userId = $this->createUser('patient', 'patient-'.$index.'-'.$suffix.'@example.test', null);
                $userIds[] = $userId;
                $profileId = DB::table('patient_profiles')->insertGetId([
                    'user_id' => $userId,
                    'full_name' => 'Concurrency Patient '.$index,
                    'dob' => '1990-01-01',
                    'gender' => 'other',
                    'relationship' => 'self',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $profileIds[] = $profileId;
                DB::table('patient_consents')->insert([
                    'user_id' => $userId,
                    'patient_profile_id' => $profileId,
                    'policy_version' => 'test-v1',
                    'is_agreed' => true,
                    'agreed_at' => now(),
                    'ip_address' => '127.0.0.1',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $worker = base_path('tests/Support/booking_race_worker.php');
            foreach ($profileIds as $index => $profileId) {
                $payload = json_encode([
                    'user_id' => $userIds[$index + 1],
                    'profile_id' => $profileId,
                    'doctor_id' => $doctorId,
                    'slot_id' => $slotId,
                    'barrier' => $barrier,
                    'worker' => (string) $index,
                ], JSON_THROW_ON_ERROR);
                $pipes = [];
                $process = proc_open(
                    [PHP_BINARY, $worker, $payload],
                    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
                    $pipes,
                    base_path()
                );
                $this->assertIsResource($process, 'Could not start a booking race worker.');
                fclose($pipes[0]);
                $processes[] = ['process' => $process, 'pipes' => $pipes];
            }

            $deadline = microtime(true) + 10;
            while (microtime(true) < $deadline) {
                if (file_exists($barrier.'-0-ready') && file_exists($barrier.'-1-ready')) {
                    break;
                }
                usleep(10000);
            }
            $this->assertFileExists($barrier.'-0-ready', 'First worker did not reach the race barrier.');
            $this->assertFileExists($barrier.'-1-ready', 'Second worker did not reach the race barrier.');
            touch($barrier.'-release');

            $results = [];
            foreach ($processes as $entry) {
                $stdout = stream_get_contents($entry['pipes'][1]);
                $stderr = stream_get_contents($entry['pipes'][2]);
                fclose($entry['pipes'][1]);
                fclose($entry['pipes'][2]);
                $exitCode = proc_close($entry['process']);
                $this->assertSame(0, $exitCode, trim((string) $stderr));
                $results[] = json_decode(trim((string) $stdout), true, 512, JSON_THROW_ON_ERROR);
            }

            $this->assertSame(1, count(array_filter($results, fn (array $result) => $result['result'] === 'booked')));
            $this->assertSame(1, count(array_filter($results, fn (array $result) => $result === ['result' => 'unavailable', 'code' => 'SE001'])));
            $this->assertSame(1, (int) DB::table('slots')->where('id', $slotId)->value('booked_count'));
            $this->assertSame(1, DB::table('bookings')->where('slot_id', $slotId)->count());
            $this->assertSame(220000, (int) DB::table('payments')->whereIn(
                'booking_id',
                DB::table('bookings')->where('slot_id', $slotId)->select('id')
            )->value('total_amount'));
        } finally {
            if ($slotId !== null) {
                $bookingIds = DB::table('bookings')->where('slot_id', $slotId)->pluck('id');
                $paymentIds = DB::table('payments')->whereIn('booking_id', $bookingIds)->pluck('id');
                DB::table('audit_logs')->where('entity_type', 'booking')->whereIn('entity_id', $bookingIds)->delete();
                DB::table('payment_transactions')->whereIn('payment_id', $paymentIds)->delete();
                DB::table('refunds')->whereIn('payment_id', $paymentIds)->delete();
                DB::table('payments')->whereIn('booking_id', $bookingIds)->delete();
                DB::table('bookings')->where('slot_id', $slotId)->delete();
                DB::table('slots')->where('id', $slotId)->delete();
            }
            if ($doctorId !== null) {
                DB::table('doctors')->where('id', $doctorId)->delete();
            }
            if ($profileIds !== []) {
                DB::table('patient_profiles')->whereIn('id', $profileIds)->delete();
            }
            if ($userIds !== []) {
                DB::table('audit_logs')->whereIn('actor_id', $userIds)->delete();
                DB::table('patient_consents')->whereIn('user_id', $userIds)->delete();
                DB::table('users')->whereIn('id', $userIds)->delete();
            }
            if ($specialtyId !== null) {
                DB::table('specialties')->where('id', $specialtyId)->delete();
            }
            if ($hospitalId !== null) {
                DB::table('hospitals')->where('id', $hospitalId)->delete();
            }

            foreach ($processes as $entry) {
                if (is_resource($entry['process'])) {
                    proc_terminate($entry['process']);
                    foreach ($entry['pipes'] as $pipe) {
                        if (is_resource($pipe)) {
                            fclose($pipe);
                        }
                    }
                    proc_close($entry['process']);
                }
            }

            foreach (glob($barrier.'*') ?: [] as $path) {
                @unlink($path);
            }
        }
    }

    private function createUser(string $role, string $email, ?int $hospitalId): int
    {
        return (int) DB::table('users')->insertGetId([
            'name' => 'Concurrency '.$role,
            'email' => $email,
            'password' => bcrypt('test-password'),
            'role' => $role,
            'status' => 'active',
            'hospital_id' => $hospitalId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}