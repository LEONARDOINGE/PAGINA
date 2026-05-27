<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('content');
            $table->boolean('pinned')->default(false);
            $table->boolean('private')->default(false);
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 20);
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('type', 30)->default('consulta');
            $table->date('date');
            $table->time('time');
            $table->integer('duration')->default(60);
            $table->string('location')->nullable();
            $table->string('status', 20)->default('programado');
            $table->text('notes')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->string('priority', 20)->default('media');
            $table->string('status', 20)->default('abierto');
            $table->string('category', 30)->default('soporte_tecnico');
            $table->timestamp('sla_deadline')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('type', 30);
            $table->string('channel', 20)->default('email');
            $table->string('status', 20)->default('borrador');
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->decimal('budget', 12, 2)->nullable();
            $table->integer('target')->nullable();
            $table->timestamps();
        });

        Schema::create('campaign_client', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->boolean('opened')->default(false);
            $table->boolean('clicked')->default(false);
            $table->timestamps();
            $table->unique(['campaign_id', 'client_id']);
        });

        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 30)->default('nps');
            $table->integer('score')->nullable();
            $table->json('responses')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->string('group', 30)->default('general');
            $table->string('type', 20)->default('string');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('campaign_client');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('settings');
    }
};
