<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'type', 'channel', 'status', 'started_at', 'ended_at', 'budget', 'target'];
    protected $casts = ['budget' => 'decimal:2', 'started_at' => 'date', 'ended_at' => 'date'];

    const TYPES = ['promocional', 'informativo', 'estacional', 'lanzamiento', 'retargeting'];
    const CHANNELS = ['email', 'sms', 'whatsapp', 'redes_sociales'];

    public function clients(): BelongsToMany { return $this->belongsToMany(Client::class); }
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(User::class); }
}
