<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'assigned_to', 'user_id', 'subject', 'description',
        'priority', 'status', 'category', 'sla_deadline', 'resolved_at',
    ];
    protected $casts = ['sla_deadline' => 'datetime', 'resolved_at' => 'datetime'];

    const PRIORITIES = ['baja', 'media', 'alta', 'urgente'];
    const STATUSES = ['abierto', 'en_progreso', 'esperando', 'resuelto', 'cerrado'];
    const CATEGORIES = ['soporte_tecnico', 'ventas', 'facturacion', 'entrega', 'reclamo', 'otro'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function scopeOpen($q) { return $q->whereNotIn('status', ['resuelto', 'cerrado']); }
    public function scopeOverdue($q) { return $q->where('sla_deadline', '<', now())->whereNotIn('status', ['resuelto', 'cerrado']); }
    public function scopeHighPriority($q) { return $q->whereIn('priority', ['alta', 'urgente']); }
}
