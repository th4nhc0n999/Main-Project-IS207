<?php

namespace Tests\Feature\Core;

use App\Enums\BookingEvent;
use App\Models\Booking;
use App\Models\Slot;
use App\Models\User;
use App\Services\BookingStateMachine;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PreparedPatientSnapshotTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();
        if (env('RUN_BKD_MYSQL_TESTS') !== '1') {
            $this->markTestSkipped('Requires RUN_BKD_MYSQL_TESTS=1 and a migrated MySQL test database.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        DB::beginTransaction();
        $this->transactionStarted = true;
    }

    protected function tearDown(): void
    {
        if ($this->transactionStarted) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    public static function bookingTypes(): array
    {
        return [['doctor'], ['hospital']];
    }

    #[DataProvider('bookingTypes')]
    public function test_t01_persists_the_exact_prepared_context_snapshot(string $type): void
    {
        [$booking, $user] = $this->fixture($type);
        $snapshot = ['full_name' => 'Prepared synthetic child', 'dob' => '2020-01-01',
            'gender' => 'other', 'relationship' => 'child', 'phone' => '*******001',
            'identity_card_number' => '*********001', 'health_insurance_code' => 'GD********001',
            'guardian_name' => 'Prepared synthetic guardian', 'guardian_phone' => '*******002',
            'guardian_relationship' => 'parent'];

        $saved = app(BookingStateMachine::class)->apply($booking, BookingEvent::T01, $user, [
            'patient_snapshot' => $snapshot,
        ]);

        $this->assertEquals($snapshot, $saved->fresh()->patient_snapshot);
        $this->assertSame(1, Slot::findOrFail($saved->slot_id)->booked_count);
        $this->assertSame(1, DB::table('payments')->where('booking_id', $saved->id)->count());
    }

    #[DataProvider('bookingTypes')]
    public function test_t01_without_context_keeps_the_previous_locked_profile_snapshot(string $type): void
    {
        [$booking, $user] = $this->fixture($type);
        $booking->patient_snapshot = ['full_name' => 'Ignored model snapshot'];
        $saved = app(BookingStateMachine::class)->apply($booking, BookingEvent::T01, $user);

        $this->assertEquals([
            'full_name' => 'Original synthetic patient', 'dob' => '2000-01-01',
            'gender' => 'other', 'relationship' => 'self', 'phone' => '*******001',
            'identity_card_number' => '*********001', 'health_insurance_code' => '************001',
        ], $saved->fresh()->patient_snapshot);
        $this->assertArrayNotHasKey('guardian_phone', $saved->patient_snapshot);
    }

    private function fixture(string $type): array
    {
        $suffix = bin2hex(random_bytes(4));
        $user = User::create(['name' => 'Synthetic core patient', 'email' => 'core-'.$suffix.'@example.test',
            'password' => 'test-only-password', 'role' => 'patient', 'status' => 'active']);
        $specialty = DB::table('specialties')->insertGetId([
            'code' => 'P'.$suffix, 'name' => 'Core test', 'slug' => 'core-'.$suffix,
        ]);
        $profile = DB::table('patient_profiles')->insertGetId([
            'user_id' => $user->id, 'full_name' => 'Original synthetic patient',
            'dob' => '2000-01-01', 'gender' => 'other', 'relationship' => 'self',
            'phone' => '0900000001', 'identity_card_number' => '000000000001',
            'health_insurance_code' => 'GD0000000000001', 'guardian_phone' => '0900000002',
        ]);
        DB::table('patient_consents')->insert(['user_id' => $user->id, 'patient_profile_id' => $profile,
            'policy_version' => 'test', 'is_agreed' => true, 'agreed_at' => now(), 'ip_address' => '127.0.0.1']);
        $hospital = null;
        $exam = null;
        $doctor = null;
        if ($type === 'doctor') {
            $doctor = DB::table('doctors')->insertGetId(['specialty_id' => $specialty,
                'name' => 'Synthetic core doctor', 'city' => 'Test', 'consultation_fee' => 200000]);
        } else {
            $hospital = DB::table('hospitals')->insertGetId(['name' => 'Synthetic core hospital',
                'address' => 'Test', 'city' => 'Test']);
            $exam = DB::table('exam_types')->insertGetId(['hospital_id' => $hospital,
                'specialty_id' => $specialty, 'name' => 'Core exam', 'price' => 200000]);
        }
        $slot = Slot::create(['owner_type' => $type, 'owner_id' => $doctor ?? $hospital,
            'specialty_id' => $specialty, 'work_date' => now()->addDays(3)->toDateString(),
            'start_time' => '10:00:00', 'end_time' => '10:30:00',
            'capacity' => 1, 'booked_count' => 0, 'status' => 'available']);

        return [new Booking(['user_id' => $user->id, 'patient_profile_id' => $profile,
            'booking_type' => $type, 'doctor_id' => $doctor, 'hospital_id' => $hospital,
            'exam_type_id' => $exam, 'slot_id' => $slot->id]), $user];
    }
}
