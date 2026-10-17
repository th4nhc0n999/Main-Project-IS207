<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('method', ['atm', 'credit_card', 'qr_pay', 'store_pay', 'momo']);
            $table->decimal('exam_fee', 10, 2);
            $table->decimal('service_fee', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded'])->default('pending');
            $table->string('transaction_code', 50)->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
