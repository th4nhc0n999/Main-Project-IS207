<?php

namespace Database\Factories;

use App\Enums\TicketStatus;
use App\Models\Booking;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        $seq = fake()->numberBetween(1, 100);
        return [
            'booking_id' => Booking::factory(),
            'ticket_code' => 'TK' . strtoupper(Str::random(12)),
            'qr_token' => 'jwt.token.mock.' . Str::random(64),
            'queue_scope' => 'HOSP_1_SPEC_1_' . date('Ymd'),
            'queue_seq' => $seq,
            'queue_number' => sprintf('A%03d', $seq),
            'room_number' => 'Phòng 204',
            'status' => TicketStatus::Issued,
            'check_in_at' => null,
            'instructions' => 'Đến trước giờ hẹn 15 phút tại quầy tiếp nhận.',
        ];
    }
}
