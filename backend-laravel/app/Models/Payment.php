<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['invoice_id', 'client_id', 'amount', 'method', 'reference', 'paid_at', 'notes'];
    protected $casts = ['amount' => 'decimal:2', 'paid_at' => 'datetime'];

    const METHODS = ['efectivo', 'transferencia', 'tarjeta', 'cheque', ' SPEI'];

    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
}
