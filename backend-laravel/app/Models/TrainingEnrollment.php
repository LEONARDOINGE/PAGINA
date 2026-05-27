<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingEnrollment extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'training_id', 'enrolled_at', 'completed_at', 'score', 'certificate_url', 'status'];
    protected $casts = ['enrolled_at' => 'date', 'completed_at' => 'date', 'score' => 'decimal:1'];

    const STATUSES = ['inscrito', 'en_progreso', 'completado', 'reprobado'];

    public function employee(): BelongsTo { return $this->belongsTo(Employee::class); }
    public function training(): BelongsTo { return $this->belongsTo(Training::class); }
}
