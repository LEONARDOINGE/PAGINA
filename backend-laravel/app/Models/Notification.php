<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'link',
        'read_at', 'priority', 'metadata',
    ];
    protected $casts = ['read_at' => 'datetime', 'metadata' => 'array'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function scopeUnread($q) { return $q->whereNull('read_at'); }
    public function scopeHighPriority($q) { return $q->where('priority', 'alta'); }
}
