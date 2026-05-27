<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id', 'position_id', 'user_id', 'employee_number', 'name',
        'curp', 'rfc', 'nss', 'phone', 'email', 'address', 'birth_date',
        'hire_date', 'termination_date', 'salary', 'commission_rate',
        'active', 'emergency_contact', 'emergency_phone', 'photo_url',
    ];
    protected $casts = [
        'salary' => 'decimal:2', 'commission_rate' => 'decimal:2',
        'birth_date' => 'date', 'hire_date' => 'date', 'termination_date' => 'date',
        'active' => 'boolean',
    ];

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function position(): BelongsTo { return $this->belongsTo(Position::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function attendance(): HasMany { return $this->hasMany(Attendance::class); }
    public function leaves(): HasMany { return $this->hasMany(Leave::class); }
    public function enrollments(): HasMany { return $this->hasMany(TrainingEnrollment::class); }
    public function reviews(): HasMany { return $this->hasMany(Review::class); }

    public function scopeActive($q) { return $q->where('active', true); }

    public function clockIn(): Attendance
    {
        return $this->attendance()->create([
            'date' => now()->toDateString(), 'clock_in' => now()->toTimeString(),
            'status' => 'presente',
        ]);
    }

    public function clockOut(Attendance $attendance): Attendance
    {
        $clockIn = strtotime($attendance->clock_in);
        $clockOut = time();
        $hours = round(($clockOut - $clockIn) / 3600, 1);
        $attendance->update(['clock_out' => now()->toTimeString(), 'hours_worked' => $hours]);
        return $attendance;
    }

    public function getAttendanceRate(?\DateTime $from = null, ?\DateTime $to = null): float
    {
        $q = $this->attendance()->where('status', 'presente');
        if ($from) $q->where('date', '>=', $from);
        if ($to) $q->where('date', '<=', $to);
        $present = $q->count();
        $total = $this->attendance()->when($from, fn($q) => $q->where('date', '>=', $from))
            ->when($to, fn($q) => $q->where('date', '<=', $to))->count();
        return $total > 0 ? round(($present / $total) * 100, 1) : 0;
    }
}
