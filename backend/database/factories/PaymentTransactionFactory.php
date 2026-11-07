<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\PaymentTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentTransactionFactory extends Factory
{
    protected $model = PaymentTransaction::class;

    public function definition(): array
    {
        return [
            'payment_id' => Payment::factory(),
            'transaction_code' => 'TXN' . strtoupper(Str::random(16)),
            'amount' => 220000,
            'status' => 'success',
            'source' => 'gateway',
            'received_at' => now(),
            'raw_payload' => ['gateway' => 'simulated', 'result' => '00'],
        ];
    }
}
