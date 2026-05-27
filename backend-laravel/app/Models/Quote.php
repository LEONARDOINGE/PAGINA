<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'lead_id', 'user_id', 'folio', 'status',
        'subtotal', 'iva', 'total', 'discount', 'valid_until',
        'notes', 'version',
    ];
    protected $casts = ['subtotal' => 'decimal:2', 'iva' => 'decimal:2', 'total' => 'decimal:2', 'discount' => 'decimal:2', 'valid_until' => 'date'];

    const STATUSES = ['borrador', 'enviado', 'aprobado', 'rechazado', 'vencido'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function items(): HasMany { return $this->hasMany(QuoteItem::class); }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(fn($i) => $i->price * $i->quantity);
        $this->discount = $this->items->sum('discount') + ($this->discount ?? 0);
        $this->subtotal -= $this->discount;
        $this->iva = $this->subtotal * 0.16;
        $this->total = $this->subtotal + $this->iva;
        $this->save();
    }

    public function convertToInvoice(): Invoice
    {
        $invoice = Invoice::create([
            'client_id' => $this->client_id,
            'user_id' => $this->user_id,
            'folio' => 'INV-' . date('Ymd') . '-' . str_pad($this->id, 4, '0', STR_PAD_LEFT),
            'status' => 'pendiente',
            'subtotal' => $this->subtotal,
            'iva' => $this->iva,
            'total' => $this->total,
            'notes' => "Convertido de Cotizacion #{$this->folio}",
        ]);

        foreach ($this->items as $item) {
            $invoice->items()->create([
                'product_id' => $item->product_id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'discount' => $item->discount,
            ]);
        }

        $this->update(['status' => 'aprobado']);
        return $invoice;
    }
}
