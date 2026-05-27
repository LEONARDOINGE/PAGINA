<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'manager_id', 'description', 'color', 'cost_center', 'budget'];
    protected $casts = ['budget' => 'decimal:2'];

    public function manager(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(Employee::class, 'manager_id'); }
    public function employees(): HasMany { return $this->hasMany(Employee::class); }
    public function positions(): HasMany { return $this->hasMany(Position::class); }

    public function getEmployeeCount(): int { return $this->employees()->where('active', true)->count(); }
    public function getSalaryBudget(): float { return (float) $this->employees()->where('active', true)->sum('salary'); }
}
