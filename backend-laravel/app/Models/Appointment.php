<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'user_id', 'title', 'type', 'date', 'time',
        'duration', 'location', 'status', 'notes', 'reminder_sent',
    ];
    protected $casts = ['date' => 'date', 'reminder_sent' => 'boolean'];

    const STATUSES = ['programado', 'confirmado', 'en_proceso', 'completado', 'cancelado', 'no_asistio'];
    const TYPES = ['sesion_foto', 'consulta', 'entrega', 'reunion', 'otro'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function employee(): BelongsTo { return $this->belongsTo(Employee::class, 'employee_id'); }

    public function scopeUpcoming($q) { return $q->where('date', '>=', now()->today())->whereIn('status', ['programado', 'confirmado']); }
    public function scopeToday($q) { return $q->where('date', now()->today()); }
}
