<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'user_id', 'folio', 'rfc', 'nombre', 'direccion',
        'uso_cfdi', 'metodo_pago', 'numero_cuenta', 'status',
        'subtotal', 'iva', 'total', 'fecha_emision', 'fecha_pago',
    ];
    protected $casts = [
        'subtotal' => 'decimal:2', 'iva' => 'decimal:2', 'total' => 'decimal:2',
        'fecha_emision' => 'date', 'fecha_pago' => 'date',
    ];

    const STATUSES = ['pendiente', 'pagado', 'vencido', 'cancelado'];
    const METODOS_PAGO = ['PUE' => 'Pago en una sola exhibicion', 'PID' => 'Pago en parcialidades'];
    const USOS_CFDI = [
        'G01' => 'Adquisicion de mercancias', 'G02' => 'Devoluciones, descuentos o bonificaciones',
        'G03' => 'Gastos en general', 'I01' => 'Construcciones', 'I02' => 'Mobiliario y equipo de oficina',
        'P01' => 'Por definir', 'D01' => 'Honorarios medicos', 'D02' => 'Gastos medicos',
    ];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function items(): HasMany { return $this->hasMany(InvoiceItem::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }

    public function scopePending($q) { return $q->where('status', 'pendiente'); }
    public function scopePaid($q) { return $q->where('status', 'pagado'); }
    public function scopeOverdue($q) { return $q->where('status', 'pendiente')->where('fecha_emision', '<', now()->subDays(30)); }

    public function getSaldo(): float { return (float) $this->total - (float) $this->payments()->sum('amount'); }

    public function markAsPaid(float $amount, ?string $method = null): Payment
    {
        $payment = $this->payments()->create([
            'amount' => $amount, 'method' => $method ?? 'transferencia',
            'reference' => strtoupper(substr(md5(time()), 0, 12)),
            'paid_at' => now(),
        ]);
        if ($this->getSaldo() <= 0) $this->update(['status' => 'pagado', 'fecha_pago' => now()]);
        return $payment;
    }

    public function toCfdi40(): array
    {
        return [
            'Folio' => $this->folio, 'Serie' => 'A',
            'Fecha' => $this->fecha_emision->format('Y-m-d\TH:i:s'),
            'SubTotal' => $this->subtotal, 'Descuento' => 0,
            'Total' => $this->total, 'MetodoPago' => $this->metodo_pago ?? 'PUE',
            'FormaPago' => '03', 'TipoDeComprobante' => 'I',
            'UsoCFDI' => $this->uso_cfdi ?? 'P01',
            'Emisor' => ['Rfc' => 'FOT260101XXX', 'Nombre' => 'FotoTec Studio', 'RegimenFiscal' => '601'],
            'Receptor' => ['Rfc' => $this->rfc ?? 'XAXX010101000', 'Nombre' => $this->nombre ?? 'Publico General', 'UsoCFDI' => $this->uso_cfdi ?? 'P01'],
            'Conceptos' => $this->items->map(fn($i) => ['ClaveProdServ' => '90111501', 'ClaveUnidad' => 'E48', 'Descripcion' => $i->description, 'Cantidad' => $i->quantity, 'ValorUnitario' => $i->price, 'Importe' => $i->quantity * $i->price])->toArray(),
        ];
    }
}
