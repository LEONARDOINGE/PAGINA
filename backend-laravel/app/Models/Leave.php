<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'approved_by', 'type', 'start_date', 'end_date',
        'days', 'reason', 'status', 'document_url',
    ];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date', 'days' => 'integer'];

    const TYPES = ['vacaciones', 'permiso_medico', 'permiso_general', 'incapacidad', 'duelo', 'maternidad', 'paternidad'];
    const STATUSES = ['solicitado', 'aprobado', 'rechazado', 'cancelado'];

    public function employee(): BelongsTo { return $this->belongsTo(Employee::class); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }

    public function scopeApproved($q) { return $q->where('status', 'aprobado'); }
    public function scopePending($q) { return $q->where('status', 'solicitado'); }
    public function scopeActive($q) { return $q->where('start_date', '<=', now())->where('end_date', '>=', now())->where('status', 'aprobado'); }
}
