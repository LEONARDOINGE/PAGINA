<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id', 'user_id', 'folio', 'status', 'subtotal', 'iva',
        'total', 'notes', 'expected_date', 'received_at',
    ];
    protected $casts = ['subtotal' => 'decimal:2', 'iva' => 'decimal:2', 'total' => 'decimal:2', 'expected_date' => 'date', 'received_at' => 'datetime'];

    const STATUSES = ['borrador', 'enviado', 'parcial', 'recibido', 'cancelado'];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function items(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(fn($i) => $i->price * $i->quantity);
        $this->iva = $this->subtotal * 0.16;
        $this->total = $this->subtotal + $this->iva;
        $this->save();
    }

    public function receive(): void
    {
        foreach ($this->items as $item) {
            $item->product->update(['stock' => $item->product->stock + $item->quantity]);
            $item->product->stockMovements()->create([
                'type' => 'entrada', 'quantity' => $item->quantity,
                'reason' => "Recepciones de OC #{$this->folio}", 'user_id' => $this->user_id,
                'reference_type' => 'purchase_order', 'reference_id' => $this->id,
            ]);
        }
        $this->update(['status' => 'recibido', 'received_at' => now()]);
    }
}
