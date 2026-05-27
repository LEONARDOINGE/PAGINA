<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Survey extends Model
{
    use HasFactory;

    protected $fillable = ['client_id', 'appointment_id', 'type', 'score', 'responses', 'feedback'];
    protected $casts = ['score' => 'integer', 'responses' => 'array'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function appointment(): BelongsTo { return $this->belongsTo(Appointment::class); }
    public function scopeHighScore($q) { return $q->where('score', '>=', 8); }
}
