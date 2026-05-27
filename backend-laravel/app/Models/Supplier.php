<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'contact_name', 'email', 'phone', 'address',
        'category', 'rating', 'payment_terms', 'lead_time_days',
        'active', 'notes',
    ];
    protected $casts = ['rating' => 'decimal:1', 'lead_time_days' => 'integer', 'active' => 'boolean'];

    public function products(): HasMany { return $this->hasMany(Product::class, 'preferred_supplier_id'); }
    public function purchaseOrders(): HasMany { return $this->hasMany(PurchaseOrder::class); }

    public function scopeActive($q) { return $q->where('active', true); }
    public function scopeTopRated($q) { return $q->orderByDesc('rating'); }
}
