<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'address', 'phone', 'manager', 'active'];
    protected $casts = ['active' => 'boolean'];

    public function inventory(): HasMany { return $this->hasMany(Inventory::class); }

    public function scopeActive($q) { return $q->where('active', true); }
}
