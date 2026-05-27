<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'phone', 'company', 'rfc', 'address',
        'city', 'state', 'zip', 'segment', 'tags', 'lead_source',
        'lifetime_value', 'health_score', 'notes', 'active', 'user_id',
    ];
    protected $casts = [
        'tags' => 'array', 'lifetime_value' => 'decimal:2',
        'health_score' => 'integer', 'active' => 'boolean',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leads(): HasMany { return $this->hasMany(Lead::class); }
    public function quotes(): HasMany { return $this->hasMany(Quote::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
    public function notes(): HasMany { return $this->hasMany(Note::class); }
    public function activities(): HasMany { return $this->hasMany(Activity::class, 'entity')->where('entity_type', 'client'); }
    public function appointments(): HasMany { return $this->hasMany(Appointment::class); }
    public function tickets(): HasMany { return $this->hasMany(Ticket::class); }
    public function campaigns(): BelongsToMany { return $this->belongsToMany(Campaign::class); }
    public function surveys(): HasMany { return $this->hasMany(Survey::class); }

    public function scopeActive($q) { return $q->where('active', true); }
    public function scopeVip($q) { return $q->where('segment', 'vip'); }
    public function scopeCorporate($q) { return $q->where('segment', 'corporate'); }

    public function calculateLTV(): float
    {
        return (float) $this->invoices()->where('status', 'pagado')->sum('total') ?: 0;
    }

    public function calculateHealthScore(): int
    {
        $invoiceRatio = $this->invoices()->where('status', 'pagado')->count() /
            max(1, $this->invoices()->count());
        $recentActivity = $this->activities()->where('created_at', '>=', now()->subDays(30))->count();
        $activityScore = min(100, $recentActivity * 10);
        return (int) (($invoiceRatio * 0.6 + $activityScore / 100 * 0.4) * 100);
    }
}
