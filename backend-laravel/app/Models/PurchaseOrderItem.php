<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = ['purchase_order_id', 'product_id', 'description', 'quantity', 'price', 'received_quantity'];
    protected $casts = ['quantity' => 'integer', 'received_quantity' => 'integer', 'price' => 'decimal:2'];

    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function getSubtotal(): float { return $this->price * $this->quantity; }
}
