<?php

namespace Tests\Feature;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\Ticket;
use App\Models\User;
use App\Services\BookingStateMachine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class HospitalTicketConcurrencyTest extends TestCase
{
    public static function modes(): array
    {
        return [['booking'], ['issue'], ['check_in'], ['request_key']];
    }

    #[DataProvider('modes')]
    public function test_concurrent_hospital_operations(string $mode): void
    {
        if (env('RUN_MYSQL_CONCURRENCY_TESTS') !== '1') {
            $this->markTestSkipped('Set RUN_MYSQL_CONCURRENCY_TESTS=1 for separate-process MySQL tests.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        config(['medsi.qr_secret' => str_repeat('race', 8)]);
        $suffix = (string) Str::uuid();
        $barrier = sys_get_temp_dir().'/medsi-hospital-'.$suffix;
        $hospital = null;
        $specialty = null;
        $userIds = [];
        $slotIds = [];
        $workers = [];
        try {
            $hospital = DB::table('hospitals')->insertGetId(['name' => 'Synthetic race hospital', 'address' => 'Test', 'city' => 'Test']);
            $specialty = DB::table('specialties')->insertGetId(['code' => 'Q'.strtoupper(substr(str_replace('-', '', $suffix), 0, 8)), 'name' => 'Race', 'slug' => $suffix]);
            $exam = DB::table('exam_types')->insertGetId(['hospital_id' => $hospital, 'specialty_id' => $specialty, 'name' => 'Race exam', 'price' => 200000]);
            $bookings = [];
            for ($index = 0; $index < 2; $index++) {
                if ($mode !== 'request_key' || $index === 0) {
                    $user = User::create(['name' => 'Synthetic race patient', 'email' => $index.'-'.$suffix.'@example.test', 'password' => 'test-only', 'role' => 'patient', 'status' => 'active']);
                }
                $userIds[] = $user->id;
                $profile = DB::table('patient_profiles')->insertGetId(['user_id' => $user->id, 'full_name' => 'Synthetic race profile', 'dob' => '1990-01-01', 'gender' => 'other', 'relationship' => 'self']);
                DB::table('patient_consents')->insert(['user_id' => $user->id, 'patient_profile_id' => $profile, 'policy_version' => 'test', 'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);
                if ($index === 0 || in_array($mode, ['issue', 'request_key'], true)) {
                    $slot = Slot::create(['owner_type' => 'hospital', 'owner_id' => $hospital, 'specialty_id' => $specialty, 'work_date' => today()->addDays(2)->toDateString(), 'start_time' => $index === 0 ? '09:00' : '13:00', 'end_time' => $index === 0 ? '12:00' : '16:00', 'capacity' => 1]);
                    $slotIds[] = $slot->id;
                }
                $bookings[] = ['user_id' => $user->id, 'patient_profile_id' => $profile, 'booking_type' => 'hospital', 'hospital_id' => $hospital, 'exam_type_id' => $exam, 'slot_id' => $slotIds[in_array($mode, ['issue', 'request_key'], true) ? $index : 0], 'request_key' => $mode === 'request_key' ? $suffix : (string) Str::uuid()];
            }

            $payloads = [];
            foreach ($bookings as $index => $attributes) {
                $payload = ['mode' => $mode, 'worker' => $index, 'barrier' => $barrier, 'user_id' => $attributes['user_id'], 'now' => now()->toIso8601String(), 'booking' => $attributes];
                if ($mode === 'issue' || ($mode === 'check_in' && $index === 0)) {
                    $booking = app(BookingStateMachine::class)->apply(new Booking($attributes), BookingEvent::T01, User::findOrFail($attributes['user_id']));
                    DB::table('payments')->where('booking_id', $booking->id)->update(['status' => 'paid', 'received_amount' => 220000]);
                    $payload['booking_id'] = $booking->id;
                    if ($mode === 'check_in') {
                        app(BookingStateMachine::class)->apply($booking, BookingEvent::T02H, 'gateway');
                        $token = Ticket::where('booking_id', $booking->id)->value('qr_token');
                    }
                }
                if ($mode === 'check_in') {
                    $staff = User::create(['name' => 'Synthetic race staff', 'email' => 'staff-'.$index.'-'.$suffix.'@example.test', 'password' => 'test-only', 'role' => 'staff', 'hospital_id' => $hospital, 'status' => 'active']);
                    $userIds[] = $staff->id;
                    $payload['user_id'] = $staff->id;
                    $payload['token'] = $token;
                    $payload['now'] = today()->addDays(2)->setTime(9, 0)->toIso8601String();
                }
                $payloads[] = $payload;
            }

            foreach ($payloads as $payload) {
                $pipes = [];
                $process = proc_open([PHP_BINARY, base_path('tests/Support/hospital_ticket_race_worker.php'), json_encode($payload, JSON_THROW_ON_ERROR)], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path());
                $this->assertIsResource($process);
                fclose($pipes[0]);
                $workers[] = ['process' => $process, 'pipes' => $pipes];
            }
            $deadline = microtime(true) + 15;
            while (microtime(true) < $deadline && (! file_exists($barrier.'-0-ready') || ! file_exists($barrier.'-1-ready'))) {
                usleep(10000);
            }
            $this->assertFileExists($barrier.'-0-ready');
            $this->assertFileExists($barrier.'-1-ready');
            touch($barrier.'-release');
            $results = [];
            foreach ($workers as &$worker) {
                $out = stream_get_contents($worker['pipes'][1]);
                $err = stream_get_contents($worker['pipes'][2]);
                fclose($worker['pipes'][1]);
                fclose($worker['pipes'][2]);
                $exit = proc_close($worker['process']);
                $worker['closed'] = true;
                $this->assertSame(0, $exit, $err);
                $results[] = json_decode($out, true, flags: JSON_THROW_ON_ERROR);
            }
            unset($worker);
            $outcomes = array_column($results, 'result');
            sort($outcomes);
            if ($mode === 'booking') {
                $this->assertSame(['booked', 'unavailable'], $outcomes);
                $this->assertContains('SE001', array_column($results, 'code'));
                $this->assertSame(1, Slot::findOrFail($slotIds[0])->booked_count);
            } elseif ($mode === 'issue') {
                $this->assertSame(['issued', 'issued'], $outcomes);
                $tickets = DB::table('tickets')->whereIn('booking_id', Booking::whereIn('slot_id', $slotIds)->select('id'))->orderBy('queue_seq')->get();
                $this->assertSame([1, 2], $tickets->pluck('queue_seq')->all());
                $this->assertCount(1, $tickets->pluck('queue_scope')->unique());
            } elseif ($mode === 'request_key') {
                $this->assertSame(['booked', 'conflict'], $outcomes);
                $this->assertSame(1, (int) Slot::whereIn('id', $slotIds)->sum('booked_count'));
                $this->assertSame(1, Booking::whereIn('slot_id', $slotIds)->count());
            } else {
                $this->assertSame(['checked_in', 'duplicate'], $outcomes);
                $this->assertSame(1, DB::table('audit_logs')->where('action', 'T09')->whereIn('entity_id', Booking::whereIn('slot_id', $slotIds)->select('id'))->count());
                $this->assertSame(1, Slot::findOrFail($slotIds[0])->booked_count);
            }
        } finally {
            foreach ($workers as $worker) {
                if (empty($worker['closed'])) {
                    proc_terminate($worker['process']);
                    foreach ($worker['pipes'] as $pipe) {
                        if (is_resource($pipe)) {
                            fclose($pipe);
                        }
                    }
                    proc_close($worker['process']);
                }
            }
            $ids = Booking::whereIn('slot_id', $slotIds)->pluck('id');
            $payments = DB::table('payments')->whereIn('booking_id', $ids)->pluck('id');
            DB::table('audit_logs')->where('entity_type', 'booking')->whereIn('entity_id', $ids)->delete();
            DB::table('tickets')->whereIn('booking_id', $ids)->delete();
            DB::table('refunds')->whereIn('booking_id', $ids)->delete();
            DB::table('payment_transactions')->whereIn('payment_id', $payments)->delete();
            DB::table('payments')->whereIn('id', $payments)->delete();
            Booking::whereIn('id', $ids)->delete();
            Slot::whereIn('id', $slotIds)->delete();
            DB::table('patient_consents')->whereIn('user_id', $userIds)->delete();
            DB::table('patient_profiles')->whereIn('user_id', $userIds)->delete();
            User::whereIn('id', $userIds)->delete();
            DB::table('exam_types')->where('hospital_id', $hospital)->delete();
            DB::table('specialties')->where('id', $specialty)->delete();
            DB::table('hospitals')->where('id', $hospital)->delete();
            foreach (glob($barrier.'*') ?: [] as $path) {
                unlink($path);
            }
        }
    }
}
