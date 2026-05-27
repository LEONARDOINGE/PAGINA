<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Training extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'instructor', 'duration_hours', 'type', 'active'];
    protected $casts = ['duration_hours' => 'integer', 'active' => 'boolean'];

    public function enrollments(): HasMany { return $this->hasMany(TrainingEnrollment::class); }
    public function scopeActive($q) { return $q->where('active', true); }
}
