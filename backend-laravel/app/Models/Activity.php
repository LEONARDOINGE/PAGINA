<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = ['entity_type', 'entity_id', 'user_id', 'assigned_to', 'type', 'description', 'metadata', 'due_date', 'completed_at'];
    protected $casts = ['metadata' => 'array', 'due_date' => 'date', 'completed_at' => 'datetime'];

    const TYPES = ['llamada', 'email', 'reunion', 'tarea', 'nota', 'whatsapp', 'sms', 'visita'];

    public function entity(): MorphTo { return $this->morphTo(); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }

    public function scopeUpcoming($q) { return $q->whereNull('completed_at')->where('due_date', '>=', now()); }
    public function scopeOverdue($q) { return $q->whereNull('completed_at')->where('due_date', '<', now()); }
    public function scopeOfType($q, $type) { return $q->where('type', $type); }
}
