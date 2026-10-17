<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_profile_id')->constrained()->restrictOnDelete();
            $table->enum('booking_type', ['doctor', 'hospital']);
            $table->foreignId('doctor_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('hospital_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('exam_type_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('slot_id')->constrained()->restrictOnDelete();
            $table->text('symptoms')->nullable();
            $table->enum('status', ['pending', 'pending_payment', 'confirmed', 'rejected', 'cancelled', 'completed'])->default('pending');
            $table->dateTime('slot_hold_expires_at')->nullable();
            $table->string('note', 255)->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
            $table->index('slot_id');
            $table->index('patient_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
