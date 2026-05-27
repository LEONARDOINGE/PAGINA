<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';
    protected $fillable = ['product_id', 'warehouse_id', 'quantity', 'location_bin'];
    protected $casts = ['quantity' => 'integer'];

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function scopeLowStock($q) { return $q->where('quantity', '<=', 10); }
}
