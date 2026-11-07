<?php

namespace Tests\Unit\Bkd;

use App\Enums\BookingStatus;
use App\Http\Resources\Bkd\BookingResource;
use App\Models\Booking;
use Illuminate\Http\Request;
use Tests\TestCase;

class BookingResourcePrivacyTest extends TestCase
{
    public function test_existing_unmasked_reasons_are_masked_on_api_reads(): void
    {
        $booking = new Booking([
            'status' => BookingStatus::CANCELLED, 'patient_snapshot' => ['full_name' => 'Synthetic patient'],
            'cancel_reason' => 'CCCD 000000000001', 'reject_reason' => 'BHYT GD0000000000000, SĐT 0900000000',
        ]);
        $data = (new BookingResource($booking))->toArray(Request::create('/api/doctor-bookings/1'));
        $this->assertSame('CCCD ********0001', $data['cancel_reason']);
        $this->assertSame('BHYT GD*********0000, SĐT ******0000', $data['reject_reason']);
        // Reading a legacy booking must not silently rewrite stored history.
        $this->assertSame('CCCD 000000000001', $booking->cancel_reason);
    }
}
