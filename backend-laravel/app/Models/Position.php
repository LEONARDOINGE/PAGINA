<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends Model
{
    use HasFactory;

    protected $fillable = ['department_id', 'name', 'level', 'min_salary', 'max_salary', 'description', 'requirements'];
    protected $casts = ['min_salary' => 'decimal:2', 'max_salary' => 'decimal:2'];

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function employees(): \Illuminate\Database\Eloquent\Relations\HasMany { return $this->hasMany(Employee::class); }
}
