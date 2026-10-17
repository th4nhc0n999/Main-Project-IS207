<?php

namespace Tests\Feature;

use App\Models\{Hospital, ExamType, PatientProfile, Slot, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HospitalApiTest extends TestCase
{
    use RefreshDatabase;

    private function bookingData(): array
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $hospital = Hospital::factory()->create();
        $exam = ExamType::factory()->create(['hospital_id' => $hospital->id, 'price' => 150000]);
        $profile = PatientProfile::factory()->create(['user_id' => $user->id]);
        $slot = Slot::factory()->create([
            'owner_type' => 'hospital', 'owner_id' => $hospital->id,
            'work_date' => now()->addDay(), 'start_time' => '09:00:00', 'end_time' => '10:00:00',
            'capacity' => 2, 'booked_count' => 0, 'status' => 'available',
        ]);
        return ['hospital_id' => $hospital->id, 'exam_type_id' => $exam->id,
            'patient_profile_id' => $profile->id, 'slot_id' => $slot->id];
    }

    public function test_public_search_filters_and_paginates(): void
    {
        Hospital::factory()->create(['name' => 'MedSi Central', 'city' => 'Hanoi']);
        Hospital::factory()->create(['name' => 'MedSi South', 'city' => 'Saigon']);
        $this->getJson('/api/hospitals?q=MedSi&city=Hanoi&per_page=1')
            ->assertOk()->assertJsonPath('success', true)->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'MedSi Central')->assertJsonPath('pagination.total', 1);
        $this->getJson('/api/hospitals?q=missing')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/hospitals?per_page=999')->assertUnprocessable();
    }

    public function test_detail_only_returns_future_available_slots(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(10));
        $data = $this->bookingData();
        $this->getJson('/api/hospitals/'.$data['hospital_id'])->assertOk()
            ->assertJsonCount(1, 'data.slots')->assertJsonCount(1, 'data.exam_types');
        foreach ([['status' => 'blocked'], ['status' => 'full'], ['status' => 'available', 'booked_count' => 2],
            ['booked_count' => 0, 'work_date' => today()]] as $changes) {
            Slot::findOrFail($data['slot_id'])->update($changes);
            $this->getJson('/api/hospitals/'.$data['hospital_id'])->assertOk()->assertJsonCount(0, 'data.slots');
        }
        Hospital::findOrFail($data['hospital_id'])->delete();
        $this->getJson('/api/hospitals/'.$data['hospital_id'])->assertNotFound();
        $this->getJson('/api/hospitals/999999')->assertNotFound();
    }

    public function test_booking_requires_authentication(): void
    {
        $this->postJson('/api/bookings/hospital', [])->assertUnauthorized();
    }

    public function test_booking_holds_slot_and_hands_off_to_payment_with_server_values(): void
    {
        $this->travelTo(now()->startOfSecond());
        $data = $this->bookingData();
        $response = $this->postJson('/api/bookings/hospital', $data + [
            'user_id' => 999, 'status' => 'confirmed', 'hold_minutes' => 999,
            'total_amount' => 1, 'payment_method' => 'invalid',
        ])->assertCreated()->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.booking_type', 'hospital')
            ->assertJsonPath('data.symptoms', null);
        $booking = \App\Models\Booking::findOrFail($response->json('data.id'));
        $this->assertTrue($booking->slot_hold_expires_at->equalTo(now()->addMinutes(15)));
        $this->assertSame(1, $booking->slot->booked_count);
        $this->assertEquals(150000, $booking->payment->exam_fee);
        $this->postJson('/api/payments/calculate-invoice', ['booking_id' => $booking->id])
            ->assertOk()->assertJsonPath('data.booking_id', $booking->id);
        $this->postJson('/api/bookings/hospital', $data)->assertStatus(409);
        $this->assertSame(1, $booking->slot->fresh()->booked_count);
    }

    public function test_invalid_and_foreign_data_do_not_reserve_capacity(): void
    {
        $data = $this->bookingData();
        $this->postJson('/api/bookings/hospital', [])->assertUnprocessable();
        $this->postJson('/api/bookings/hospital', $data + ['symptoms' => str_repeat('a', 2001)])->assertUnprocessable();
        $foreign = PatientProfile::factory()->create();
        $this->postJson('/api/bookings/hospital', array_replace($data, ['patient_profile_id' => $foreign->id]))->assertStatus(404);
        $otherExam = ExamType::factory()->create();
        $this->postJson('/api/bookings/hospital', array_replace($data, ['exam_type_id' => $otherExam->id]))->assertStatus(422);
        $otherHospital = Hospital::factory()->create();
        Slot::findOrFail($data['slot_id'])->update(['owner_id' => $otherHospital->id]);
        $this->postJson('/api/bookings/hospital', $data)->assertStatus(422);
        $this->assertDatabaseCount('bookings', 0);
        $this->assertSame(0, Slot::findOrFail($data['slot_id'])->booked_count);
    }

    public function test_full_blocked_and_started_slots_are_rejected(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(10));
        $data = $this->bookingData();
        foreach ([['booked_count' => 2, 'status' => 'full'], ['booked_count' => 0, 'status' => 'blocked'],
            ['status' => 'available', 'work_date' => today()]] as $changes) {
            Slot::findOrFail($data['slot_id'])->update($changes);
            $this->postJson('/api/bookings/hospital', $data)->assertStatus(422);
        }
        $this->assertDatabaseCount('bookings', 0);
    }
}
