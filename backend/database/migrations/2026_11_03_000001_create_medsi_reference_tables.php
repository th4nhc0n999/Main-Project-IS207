<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('address', 255);
            $table->string('city', 100);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('hotline', 20)->nullable();
            $table->string('image', 255)->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->index('city', 'ix_hospital_city');
        });
        DB::statement('ALTER TABLE hospitals ADD CONSTRAINT ck_hospital_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)');
        DB::statement('ALTER TABLE hospitals ADD CONSTRAINT ck_hospital_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)');

        Schema::create('specialties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique('uq_spec_code');
            $table->string('name', 100);
            $table->string('slug', 120)->unique('uq_spec_slug');
            $table->text('description')->nullable();
            $table->text('default_instructions')->nullable();
            $table->string('image', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('email', 150)->unique('uq_users_email');
            $table->string('password', 255);
            $table->string('phone', 20)->nullable();
            $table->enum('role', ['patient', 'doctor', 'staff', 'admin'])->default('patient');
            $table->enum('status', ['pending', 'active', 'locked', 'disabled'])->default('active');
            $table->unsignedBigInteger('hospital_id')->nullable();
            $table->unsignedTinyInteger('failed_login_count')->default(0);
            $table->dateTime('locked_until')->nullable();
            $table->timestamps();
            $table->index(['role', 'status'], 'ix_users_role');
            $table->index('hospital_id', 'ix_users_hospital');
            $table->foreign('hospital_id', 'fk_users_hospital_id')
                ->references('id')->on('hospitals')->restrictOnDelete();
        });
        DB::statement("ALTER TABLE users ADD CONSTRAINT ck_users_scope CHECK ((role = 'staff' AND hospital_id IS NOT NULL) OR (role <> 'staff' AND hospital_id IS NULL))");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('specialties');
        Schema::dropIfExists('hospitals');
    }
};