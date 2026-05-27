<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Note extends Model
{
    use HasFactory;

    protected $fillable = ['entity_type', 'entity_id', 'user_id', 'content', 'pinned', 'private'];
    protected $casts = ['pinned' => 'boolean', 'private' => 'boolean'];

    public function entity(): MorphTo { return $this->morphTo(); }
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(User::class); }
    public function scopePinned($q) { return $q->where('pinned', true); }
    public function scopePublic($q) { return $q->where('private', false); }
}
