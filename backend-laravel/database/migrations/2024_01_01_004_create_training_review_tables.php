<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('instructor')->nullable();
            $table->integer('duration_hours')->default(1);
            $table->string('type', 30)->default('tecnico');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('training_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_id')->constrained()->cascadeOnDelete();
            $table->date('enrolled_at');
            $table->date('completed_at')->nullable();
            $table->decimal('score', 3, 1)->nullable();
            $table->string('certificate_url')->nullable();
            $table->string('status', 20)->default('inscrito');
            $table->timestamps();
            $table->unique(['employee_id', 'training_id']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('period', 20);
            $table->decimal('rating_overall', 3, 1)->nullable();
            $table->decimal('rating_performance', 3, 1)->nullable();
            $table->decimal('rating_teamwork', 3, 1)->nullable();
            $table->decimal('rating_leadership', 3, 1)->nullable();
            $table->json('goals_achieved')->nullable();
            $table->json('goals_next')->nullable();
            $table->text('strengths')->nullable();
            $table->text('areas_improvement')->nullable();
            $table->text('comments')->nullable();
            $table->string('status', 20)->default('borrador');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('trainings');
    }
};
