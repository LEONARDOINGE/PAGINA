<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'assigned_to', 'stage', 'score', 'source',
        'interest_level', 'budget', 'timeline', 'notes', 'converted_at',
    ];
    protected $casts = ['score' => 'integer', 'budget' => 'decimal:2', 'converted_at' => 'datetime'];

    const STAGES = ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function activities(): HasMany { return $this->hasMany(Activity::class, 'entity')->where('entity_type', 'lead'); }
    public function quotes(): HasMany { return $this->hasMany(Quote::class); }

    public function scopeActive($q) { return $q->whereNotIn('stage', ['ganado', 'perdido']); }

    public function convertToClient(User $assignedBy): Client
    {
        $this->update(['stage' => 'ganado', 'converted_at' => now()]);
        return $this->client;
    }
}
