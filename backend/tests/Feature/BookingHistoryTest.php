<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected BookingService $bookingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookingService = new BookingService();
    }

    public function test_user_can_fetch_their_own_booking_history_via_service(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $patientProfile = PatientProfile::factory()->create(['user_id' => $user->id]);
        $specialty = Specialty::create(['name' => 'Tim mạch']);
        $doctor = Doctor::create([
            'specialty_id' => $specialty->id,
            'name' => 'Dr. Phạm Văn X',
            'city' => 'Hà Nội',
            'address' => '456 Đường XYZ',
        ]);
        $slot = Slot::create([
            'owner_type' => 'doctor',
            'owner_id' => $doctor->id,
            'work_date' => now()->addDays(2)->toDateString(),
            'start_time' => '09:00',
            'end_time' => '09:30',
            'capacity' => 1,
        ]);

        $booking = Booking::create([
            'user_id' => $user->id,
            'patient_profile_id' => $patientProfile->id,
            'booking_type' => 'doctor',
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'pending',
        ]);

        $result = $this->bookingService->getUserBookings($user->id);

        $this->assertCount(1, $result->items());
        $this->assertEquals($booking->id, $result->items()[0]->id);
        $this->assertEquals('Dr. Phạm Văn X', $result->items()[0]->doctor->name);
    }

    public function test_user_can_filter_booking_history_by_status(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create(['user_id' => $user->id]);

        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $profile->id,
            'status' => 'pending',
        ]);

        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $profile->id,
            'status' => 'confirmed',
        ]);

        $pendingResult = $this->bookingService->getUserBookings($user->id, ['status' => 'pending']);
        $this->assertCount(1, $pendingResult->items());
        $this->assertEquals('pending', $pendingResult->items()[0]->status);

        $confirmedResult = $this->bookingService->getUserBookings($user->id, ['status' => 'confirmed']);
        $this->assertCount(1, confirmedResult: $confirmedResult->items());
        $this->assertEquals('confirmed', $confirmedResult->items()[0]->status);
    }

    public function test_user_can_search_booking_history_by_keyword(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $profile1 = PatientProfile::factory()->create([
            'user_id' => $user->id,
            'full_name' => 'Nguyễn Văn An',
        ]);
        $profile2 = PatientProfile::factory()->create([
            'user_id' => $user->id,
            'full_name' => 'Trần Thị Bình',
        ]);

        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $profile1->id,
            'code' => 'BK2026001',
        ]);

        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $profile2->id,
            'code' => 'BK2026002',
        ]);

        $searchCode = $this->bookingService->getUserBookings($user->id, ['q' => 'BK2026001']);
        $this->assertCount(1, $searchCode->items());
        $this->assertEquals('BK2026001', $searchCode->items()[0]->code);

        $searchName = $this->bookingService->getUserBookings($user->id, ['q' => 'Trần Thị Bình']);
        $this->assertCount(1, $searchName->items());
        $this->assertEquals('BK2026002', $searchName->items()[0]->code);
    }

    public function test_user_cannot_see_other_users_bookings(): void
    {
        /** @var User $userA */
        $userA = User::factory()->create();
        /** @var User $userB */
        $userB = User::factory()->create();

        $profileA = PatientProfile::factory()->create(['user_id' => $userA->id]);
        $profileB = PatientProfile::factory()->create(['user_id' => $userB->id]);

        Booking::factory()->create([
            'user_id' => $userA->id,
            'patient_profile_id' => $profileA->id,
        ]);

        Booking::factory()->create([
            'user_id' => $userB->id,
            'patient_profile_id' => $profileB->id,
        ]);

        $resultA = $this->bookingService->getUserBookings($userA->id);
        $this->assertCount(1, $resultA->items());
        $this->assertEquals($userA->id, $resultA->items()[0]->user_id);
    }

    public function test_authenticated_user_can_get_booking_history_via_api(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $profile = PatientProfile::factory()->create(['user_id' => $user->id]);

        Booking::factory()->create([
            'user_id' => $user->id,
            'patient_profile_id' => $profile->id,
            'status' => 'confirmed',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/bookings');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lấy danh sách lịch khám thành công',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_unauthenticated_user_cannot_access_booking_history_api(): void
    {
        $response = $this->getJson('/api/bookings');

        $response->assertStatus(401);
    }
}
