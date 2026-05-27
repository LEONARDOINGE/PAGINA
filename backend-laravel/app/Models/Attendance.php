<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';
    protected $fillable = [
        'employee_id', 'date', 'clock_in', 'clock_out',
        'hours_worked', 'status', 'notes', 'correction_requested',
        'correction_reason', 'approved',
    ];
    protected $casts = ['date' => 'date', 'hours_worked' => 'decimal:2'];

    const STATUSES = ['presente', 'falta', 'retardo', 'permiso', 'vacaciones', 'incapacidad'];

    public function employee(): BelongsTo { return $this->belongsTo(Employee::class); }

    public function scopeToday($q) { return $q->where('date', now()->toDateString()); }
    public function scopeMonth($q, $month, $year) { return $q->whereMonth('date', $month)->whereYear('date', $year); }
}
