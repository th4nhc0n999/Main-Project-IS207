<?php

namespace Tests\Feature\Bkd;

use App\Models\Slot;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class DoctorBookingConcurrencyTest extends TestCase
{
    public function test_bkd_service_has_one_winner_for_the_last_place_on_separate_connections(): void
    {
        if (env('RUN_BKD_MYSQL_TESTS') !== '1') {
            $this->markTestSkipped('Requires explicit MySQL test opt-in.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        $suffix = bin2hex(random_bytes(4));
        $processes = [];
        $users = [];
        $profiles = [];
        $specialty = null;
        $doctor = null;
        $slot = null;
        $barrier = sys_get_temp_dir().DIRECTORY_SEPARATOR.'bkd-race-'.$suffix;

        try {
            $specialty = DB::table('specialties')->insertGetId([
                'code' => 'B'.$suffix, 'name' => 'Race test', 'slug' => 'race-'.$suffix,
            ]);
            $doctor = DB::table('doctors')->insertGetId([
                'specialty_id' => $specialty, 'name' => 'Race doctor', 'city' => 'Test', 'consultation_fee' => 200000,
            ]);
            $slot = Slot::create(['owner_type' => 'doctor', 'owner_id' => $doctor,
                'specialty_id' => $specialty, 'work_date' => now()->addDays(2)->toDateString(),
                'start_time' => '10:00:00', 'end_time' => '10:30:00',
                'capacity' => 1, 'booked_count' => 0, 'status' => 'available']);

            for ($i = 0; $i < 2; $i++) {
                $user = User::create(['name' => 'Race patient', 'email' => "race-{$suffix}-{$i}@example.test",
                    'password' => 'test-only-password', 'role' => 'patient', 'status' => 'active']);
                $users[] = $user->id;
                $profile = DB::table('patient_profiles')->insertGetId([
                    'user_id' => $user->id, 'full_name' => 'Race patient', 'dob' => '2000-01-01',
                    'gender' => 'other', 'relationship' => 'self',
                ]);
                $profiles[] = $profile;
                DB::table('patient_consents')->insert(['user_id' => $user->id, 'patient_profile_id' => $profile,
                    'policy_version' => 'test', 'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);
                $payload = json_encode(['user_id' => $user->id, 'barrier' => $barrier, 'worker' => $i,
                    'booking' => ['doctor_id' => $doctor, 'slot_id' => $slot->id,
                        'patient_profile_id' => $profile, 'request_key' => 'race-'.$suffix.'-'.$i]], JSON_THROW_ON_ERROR);
                $process = new Process([PHP_BINARY, base_path('tests/Support/bkd_race_worker.php'), $payload], base_path());
                $process->setTimeout(25)->start();
                $processes[] = $process;
            }
            $deadline = microtime(true) + 15;
            while ((! file_exists($barrier.'-0-ready') || ! file_exists($barrier.'-1-ready')) && microtime(true) < $deadline) {
                usleep(10000);
            }
            $this->assertFileExists($barrier.'-0-ready');
            $this->assertFileExists($barrier.'-1-ready');
            touch($barrier.'-release');
            $results = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                $results[] = json_decode(trim($process->getOutput()), true, 512, JSON_THROW_ON_ERROR);
            }
            $this->assertCount(1, array_filter($results, fn ($r) => $r['result'] === 'booked'));
            $this->assertCount(1, array_filter($results, fn ($r) => $r === ['result' => 'unavailable', 'code' => 'SE001']));
            $this->assertSame(1, $slot->fresh()->booked_count);
            $ids = DB::table('bookings')->where('slot_id', $slot->id)->pluck('id');
            $this->assertCount(1, $ids);
            $this->assertSame(1, DB::table('payments')->whereIn('booking_id', $ids)->count());
        } finally {
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
            if ($slot) {
                $ids = DB::table('bookings')->where('slot_id', $slot->id)->pluck('id');
                DB::table('audit_logs')->where('entity_type', 'booking')->whereIn('entity_id', $ids)->delete();
                DB::table('payments')->whereIn('booking_id', $ids)->delete();
                DB::table('bookings')->whereIn('id', $ids)->delete();
                $slot->delete();
            }
            DB::table('patient_consents')->whereIn('patient_profile_id', $profiles)->delete();
            DB::table('patient_profiles')->whereIn('id', $profiles)->delete();
            if ($doctor) {
                DB::table('doctors')->where('id', $doctor)->delete();
            }
            DB::table('users')->whereIn('id', $users)->delete();
            if ($specialty) {
                DB::table('specialties')->where('id', $specialty)->delete();
            }
            foreach (['-0-ready', '-1-ready', '-release'] as $suffix) {
                if (is_file($barrier.$suffix)) {
                    unlink($barrier.$suffix);
                }
            }
        }
    }
}
