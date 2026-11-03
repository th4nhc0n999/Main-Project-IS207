<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('full_name', 150);
            $table->date('dob');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('phone', 20)->nullable();
            $table->string('relationship', 50);
            $table->string('identity_card_number', 20)->nullable();
            $table->string('health_insurance_code', 20)->nullable();
            $table->string('guardian_name', 150)->nullable();
            $table->string('guardian_phone', 20)->nullable();
            $table->string('guardian_relationship', 50)->nullable();
            $table->boolean('is_default')->default(false);
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['user_id', 'identity_card_number'], 'uq_profile_user_cccd');
            $table->index(['user_id', 'deleted_at'], 'ix_profile_user');
        });

        Schema::create('patient_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('patient_profile_id');
            $table->string('policy_version', 20);
            $table->boolean('is_agreed');
            $table->dateTime('agreed_at');
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->dateTime('revoked_at')->nullable();
            $table->timestamps();
            $table->index('patient_profile_id', 'ix_consent_profile');
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique('uq_doctor_user')->constrained()->restrictOnDelete();
            $table->foreignId('specialty_id')->constrained()->restrictOnDelete();
            $table->foreignId('hospital_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name', 150);
            $table->string('title', 50)->nullable();
            $table->unsignedTinyInteger('years_experience')->nullable();
            $table->text('bio')->nullable();
            $table->string('city', 100);
            $table->string('address', 255)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('consultation_fee', 12, 0)->default(0);
            $table->string('avatar', 255)->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->index('specialty_id', 'ix_doctor_spec');
            $table->index('city', 'ix_doctor_city');
            $table->index('hospital_id', 'ix_doctor_hospital');
        });
        DB::statement('ALTER TABLE doctors ADD CONSTRAINT ck_doctor_fee CHECK (consultation_fee >= 0)');

        Schema::create('exam_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialty_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name', 150);
            $table->decimal('price', 12, 0);
            $table->softDeletes();
            $table->timestamps();
            $table->index('hospital_id', 'ix_exam_hospital');
        });
        DB::statement('ALTER TABLE exam_types ADD CONSTRAINT ck_exam_price CHECK (price >= 0)');

        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->enum('owner_type', ['doctor', 'hospital']);
            $table->unsignedBigInteger('owner_id');
            $table->foreignId('specialty_id')->constrained()->restrictOnDelete();
            $table->date('work_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('capacity')->default(1);
            $table->unsignedInteger('booked_count')->default(0);
            $table->enum('status', ['available', 'full', 'blocked'])->default('available');
            $table->timestamps();
            $table->unique(
                ['owner_type', 'owner_id', 'specialty_id', 'work_date', 'start_time'],
                'uq_slot'
            );
            $table->index(['owner_type', 'owner_id', 'work_date'], 'ix_slot_owner');
            $table->index(['work_date', 'status'], 'ix_slot_date');
        });
        DB::statement('ALTER TABLE slots ADD CONSTRAINT ck_slot_count CHECK (booked_count <= capacity)');
        DB::statement('ALTER TABLE slots ADD CONSTRAINT ck_slot_cap CHECK (capacity >= 1)');
        DB::statement('ALTER TABLE slots ADD CONSTRAINT ck_slot_time CHECK (start_time < end_time)');
    }

    public function down(): void
    {
        Schema::dropIfExists('slots');
        Schema::dropIfExists('exam_types');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('patient_consents');
        Schema::dropIfExists('patient_profiles');
    }
};