<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique('uq_booking_code');
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('patient_profile_id')->constrained()->restrictOnDelete();
            $table->enum('booking_type', ['doctor', 'hospital']);
            $table->foreignId('doctor_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('hospital_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('exam_type_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('slot_id')->constrained()->restrictOnDelete();
            $table->string('symptoms', 500)->nullable();
            $table->json('patient_snapshot');
            $table->enum('status', [
                'pending_payment', 'pending_approval', 'confirmed', 'checked_in',
                'completed', 'cancelled', 'expired', 'rejected', 'no_show',
            ])->default('pending_payment');
            $table->dateTime('hold_expires_at')->nullable();
            $table->dateTime('approval_expires_at')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->dateTime('decided_at')->nullable();
            $table->string('reject_reason', 255)->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('cancel_reason_code', 30)->nullable();
            $table->string('cancel_reason', 255)->nullable();
            $table->string('request_key', 64)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'request_key'], 'uq_booking_request');
            $table->index('user_id', 'ix_booking_user');
            $table->index(['status', 'hold_expires_at'], 'ix_booking_hold');
            $table->index(['status', 'approval_expires_at'], 'ix_booking_approval');
            $table->index('slot_id', 'ix_booking_slot');
            $table->index(['patient_profile_id', 'status'], 'ix_booking_profile');
        });
        DB::statement("ALTER TABLE bookings ADD CONSTRAINT ck_booking_type CHECK ((booking_type = 'doctor' AND doctor_id IS NOT NULL AND hospital_id IS NULL AND exam_type_id IS NULL) OR (booking_type = 'hospital' AND hospital_id IS NOT NULL AND exam_type_id IS NOT NULL AND doctor_id IS NULL))");

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique('uq_payment_booking')->constrained()->restrictOnDelete();
            $table->enum('method', ['atm', 'credit_card', 'qr_pay', 'store_pay', 'momo'])->nullable();
            $table->decimal('exam_fee', 12, 0);
            $table->decimal('discount_amount', 12, 0)->default(0);
            $table->decimal('service_fee', 12, 0);
            $table->decimal('total_amount', 12, 0);
            $table->decimal('received_amount', 12, 0)->default(0);
            $table->decimal('refunded_amount', 12, 0)->default(0);
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded'])->default('pending');
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE payments ADD CONSTRAINT ck_pay_total CHECK (total_amount = exam_fee - discount_amount + service_fee)');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT ck_pay_discount CHECK (discount_amount >= 0 AND discount_amount <= exam_fee)');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT ck_pay_refund CHECK (refunded_amount >= 0 AND refunded_amount <= received_amount)');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT ck_pay_received CHECK (received_amount >= 0)');

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->restrictOnDelete();
            $table->string('transaction_code', 64)->unique('uq_txn_code');
            $table->decimal('amount', 12, 0);
            $table->enum('status', ['success', 'failed', 'pending']);
            $table->enum('source', ['gateway', 'demo_admin', 'counter']);
            $table->dateTime('received_at');
            $table->json('raw_payload')->nullable();
            $table->timestamps();
            $table->index('payment_id', 'ix_txn_payment');
        });
        DB::statement('ALTER TABLE payment_transactions ADD CONSTRAINT ck_txn_amount CHECK (amount > 0)');

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->restrictOnDelete();
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 12, 0);
            $table->decimal('exam_fee_refunded', 12, 0)->default(0);
            $table->decimal('service_fee_refunded', 12, 0)->default(0);
            $table->string('policy_case', 40);
            $table->string('reason', 255);
            $table->enum('status', ['requested', 'approved', 'processing', 'rejected', 'failed', 'succeeded'])->default('requested');
            $table->string('refund_ref', 64)->unique('uq_refund_ref');
            $table->foreignId('requested_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->dateTime('requested_at');
            $table->dateTime('processed_at')->nullable();
            $table->timestamps();
            $table->index('booking_id', 'ix_refund_booking');
            $table->index('status', 'ix_refund_status');
        });
        DB::statement('ALTER TABLE refunds ADD CONSTRAINT ck_refund_sum CHECK (amount = exam_fee_refunded + service_fee_refunded)');
        DB::statement('ALTER TABLE refunds ADD CONSTRAINT ck_refund_pos CHECK (amount >= 0)');

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique('uq_ticket_booking')->constrained()->restrictOnDelete();
            $table->string('ticket_code', 32)->unique('uq_ticket_code');
            $table->string('qr_token', 512);
            $table->string('queue_scope', 64);
            $table->unsignedInteger('queue_seq');
            $table->string('queue_number', 20);
            $table->string('room_number', 50)->nullable();
            $table->enum('status', ['issued', 'checked_in', 'completed', 'cancelled', 'expired'])->default('issued');
            $table->dateTime('check_in_at')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();
            $table->unique(['queue_scope', 'queue_seq'], 'uq_ticket_queue');
            $table->index('status', 'ix_ticket_status');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->enum('actor_type', ['user', 'system', 'gateway']);
            $table->string('action', 60);
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('reason', 255)->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('occurred_at');
            $table->index(['entity_type', 'entity_id'], 'ix_audit_entity');
            $table->index(['actor_id', 'occurred_at'], 'ix_audit_actor');
            $table->index(['action', 'occurred_at'], 'ix_audit_action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bookings');
    }
};