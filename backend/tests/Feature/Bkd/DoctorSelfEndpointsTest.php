<?php

namespace Tests\Feature\Bkd;

use App\Models\Slot;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DoctorSelfEndpointsTest extends TestCase
{
    private bool $transactionStarted = false;
    private User $doctorUser;
    private User $patient;
    private int $doctorId;
    private int $otherDoctorId;
    private int $specialtyId;

    protected function setUp(): void
    {
        parent::setUp();
        if (env('RUN_BKD_MYSQL_TESTS') !== '1') {
            $this->markTestSkipped('Set RUN_BKD_MYSQL_TESTS=1 on a migrated MySQL test database.');
        }
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
        DB::beginTransaction();
        $this->transactionStarted = true;
        $this->travelTo(now()->setDate(2030, 1, 1)->setTime(8, 0));
        $this->doctorUser = $this->user('doctor');
        $this->patient = $this->user('patient');
        $suffix = bin2hex(random_bytes(4));
        $this->specialtyId = DB::table('specialties')->insertGetId([
            'code' => 'S'.$suffix, 'name' => 'Synthetic specialty', 'slug' => 'self-'.$suffix,
        ]);
        $this->doctorId = $this->doctor($this->doctorUser);
        $this->otherDoctorId = $this->doctor($this->user('doctor'));
    }

    protected function tearDown(): void
    {
        if ($this->transactionStarted) {
            DB::rollBack();
            $this->travelBack();
        }
        parent::tearDown();
    }

    public function test_self_profile_is_resolved_from_authenticated_user_not_query_parameters(): void
    {
        Sanctum::actingAs($this->doctorUser);
        $this->getJson('/api/doctor/me?doctor_id='.$this->otherDoctorId.'&user_id='.$this->patient->id)
            ->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('data.doctor_id', $this->doctorId)
            ->assertJsonPath('data.name', 'Synthetic doctor')
            ->assertJsonPath('data.specialty.id', $this->specialtyId)
            ->assertJsonPath('data.specialty.name', 'Synthetic specialty')
            ->assertJsonMissingPath('data.user_id')->assertJsonMissingPath('data.email');
    }

    public function test_own_slots_are_scoped_to_doctor_and_date_including_past_full_and_blocked(): void
    {
        $past = $this->slot($this->doctorId, '07:00:00', 'available');
        $full = $this->slot($this->doctorId, '09:00:00', 'full');
        $blocked = $this->slot($this->doctorId, '10:00:00', 'blocked');
        $this->slot($this->otherDoctorId, '11:00:00', 'available');
        $this->slot($this->doctorId, '12:00:00', 'available', '2030-01-02');
        Sanctum::actingAs($this->doctorUser);
        $response = $this->getJson('/api/doctor/slots?date=2030-01-01&doctor_id='.$this->otherDoctorId)
            ->assertOk()->assertJsonPath('success', true)->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $past->id)->assertJsonPath('data.0.can_book', false)
            ->assertJsonPath('data.1.id', $full->id)->assertJsonPath('data.1.remaining_places', 0)
            ->assertJsonPath('data.1.status', 'full')->assertJsonPath('data.2.id', $blocked->id)
            ->assertJsonPath('data.2.status', 'blocked')->assertJsonPath('data.2.can_book', false);
        $this->assertSame([$this->doctorId], array_values(array_unique(array_column($response->json('data'), 'doctor_id'))));
    }

    public function test_patient_cannot_access_either_doctor_self_endpoint(): void
    {
        Sanctum::actingAs($this->patient);
        foreach (['/api/doctor/me', '/api/doctor/slots?date=2030-01-01'] as $url) {
            $this->getJson($url)->assertForbidden()->assertJsonPath('success', false)->assertJsonPath('code', 'FORBIDDEN');
        }
    }

    public function test_doctor_without_profile_gets_clear_not_found_from_both_endpoints(): void
    {
        Sanctum::actingAs($this->user('doctor'));
        foreach (['/api/doctor/me', '/api/doctor/slots?date=2030-01-01'] as $url) {
            $this->getJson($url)->assertNotFound()->assertJsonPath('success', false)
                ->assertJsonPath('code', 'NOT_FOUND')->assertJsonPath('message', 'Tài khoản chưa có hồ sơ bác sĩ.');
        }
    }

    public function test_archived_doctor_profile_is_not_returned(): void
    {
        DB::table('doctors')->where('id', $this->doctorId)->update(['deleted_at' => now()]);
        Sanctum::actingAs($this->doctorUser);
        $this->getJson('/api/doctor/me')->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->getJson('/api/doctor/slots?date=2030-01-01')->assertNotFound();
    }

    public function test_own_slot_date_is_required_and_empty_day_is_a_successful_empty_list(): void
    {
        Sanctum::actingAs($this->doctorUser);
        foreach (['/api/doctor/slots', '/api/doctor/slots?date=invalid'] as $url) {
            $this->getJson($url)->assertUnprocessable()->assertJsonPath('code', 'VALIDATION_ERROR');
        }
        $this->getJson('/api/doctor/slots?date=2030-01-03')->assertOk()->assertJsonPath('data', []);
    }

    public function test_anonymous_requests_require_authentication(): void
    {
        $this->getJson('/api/doctor/me')->assertUnauthorized()->assertJsonPath('code', 'UNAUTHENTICATED');
        $this->getJson('/api/doctor/slots?date=2030-01-01')->assertUnauthorized();
    }

    private function user(string $role): User
    {
        return User::create(['name' => 'Synthetic '.$role, 'email' => bin2hex(random_bytes(6)).'@example.test',
            'password' => 'test-only', 'role' => $role, 'status' => 'active']);
    }

    private function doctor(User $user): int
    {
        return DB::table('doctors')->insertGetId(['user_id' => $user->id, 'specialty_id' => $this->specialtyId,
            'name' => 'Synthetic doctor', 'city' => 'Test', 'consultation_fee' => 200000]);
    }

    private function slot(int $doctorId, string $time, string $status, string $date = '2030-01-01'): Slot
    {
        $end = \Carbon\CarbonImmutable::parse($date.' '.$time)->addMinutes(30)->format('H:i:s');
        return Slot::create(['owner_type' => 'doctor', 'owner_id' => $doctorId, 'specialty_id' => $this->specialtyId,
            'work_date' => $date, 'start_time' => $time, 'end_time' => $end,
            'capacity' => 1, 'booked_count' => $status === 'full' ? 1 : 0, 'status' => $status]);
    }
}
