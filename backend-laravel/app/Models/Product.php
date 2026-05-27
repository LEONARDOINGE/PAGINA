<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'preferred_supplier_id', 'sku', 'name', 'description',
        'price', 'cost', 'stock', 'stock_min', 'unit', 'barcode',
        'serial_number', 'expiry_date', 'location', 'active', 'type',
        'strategy', 'image_url',
    ];
    protected $casts = [
        'price' => 'decimal:2', 'cost' => 'decimal:2', 'stock' => 'integer',
        'stock_min' => 'integer', 'expiry_date' => 'date', 'active' => 'boolean',
    ];

    const TYPES = ['producto', 'servicio', 'combos', 'insumo', 'equipo'];
    const STRATEGIES = ['push', 'pull', 'hybrid'];

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function preferredSupplier(): BelongsTo { return $this->belongsTo(Supplier::class, 'preferred_supplier_id'); }
    public function inventory(): HasMany { return $this->hasMany(Inventory::class); }
    public function stockMovements(): HasMany { return $this->hasMany(StockMovement::class); }
    public function purchaseOrderItems(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }

    public function scopeActive($q) { return $q->where('active', true); }
    public function scopeLowStock($q) { return $q->whereColumn('stock', '<=', 'stock_min'); }
    public function scopeExpired($q) { return $q->where('expiry_date', '<', now()->addDays(30)); }

    public function isLowStock(): bool { return $this->stock <= $this->stock_min; }
    public function isExpired(): bool { return $this->expiry_date && $this->expiry_date->lt(now()); }
    public function getMargin(): float { return $this->price > 0 ? (($this->price - $this->cost) / $this->price) * 100 : 0; }
}
