<?php

namespace App\GraphQL\Mutations;

use App\Models\Client;
use App\Models\Lead;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthMutation
{
    public function login($root, array $args): array
    {
        $user = User::where('email', $args['email'])->first();
        if (!$user || !Hash::check($args['password'], $user->password)) {
            throw new \Exception('Credenciales invalidas');
        }
        if (!$user->active) throw new \Exception('Usuario desactivado');

        $token = base64_encode(Str::random(40));
        $user->createToken('api-token')->plainTextToken;

        AuditLog::log('login', 'user', $user->id);
        return ['token' => $token, 'user' => $user];
    }
}

class ClientMutation
{
    public function create($root, array $args): Client
    {
        $client = Client::create($args['input']);
        AuditLog::log('create', 'client', $client->id, null, $args['input']);
        return $client;
    }

    public function update($root, array $args): Client
    {
        $client = Client::findOrFail($args['id']);
        $old = $client->toArray();
        $client->update($args['input']);
        AuditLog::log('update', 'client', $client->id, $old, $args['input']);
        return $client;
    }

    public function delete($root, array $args): bool
    {
        $client = Client::findOrFail($args['id']);
        AuditLog::log('delete', 'client', $client->id, $client->toArray(), null);
        return $client->delete();
    }

    public function convertLead($root, array $args): Client
    {
        $lead = Lead::with('client')->findOrFail($args['id']);
        $lead->update(['stage' => 'ganado', 'converted_at' => now()]);
        if (isset($args['assignedTo'])) {
            $lead->update(['assigned_to' => $args['assignedTo']]);
        }
        return $lead->client;
    }
}

class QuoteMutation
{
    public function create($root, array $args): \App\Models\Quote
    {
        $folio = 'COT-' . date('Ymd') . '-' . str_pad(\App\Models\Quote::count() + 1, 4, '0', STR_PAD_LEFT);
        $quote = \App\Models\Quote::create([...$args['input'], 'folio' => $folio, 'user_id' => auth()->id()]);

        if (!empty($args['input']['items'])) {
            foreach ($args['input']['items'] as $item) {
                $quote->items()->create($item);
            }
            $quote->calculateTotals();
        }
        AuditLog::log('create', 'quote', $quote->id);
        return $quote;
    }

    public function convertQuoteToInvoice($root, array $args): \App\Models\Invoice
    {
        $quote = \App\Models\Quote::with('items')->findOrFail($args['quoteId']);
        $invoice = $quote->convertToInvoice();
        AuditLog::log('convert', 'quote', $quote->id, ['quote' => $quote->folio], ['invoice' => $invoice->folio]);
        return $invoice;
    }
}

class ProductMutation
{
    public function create($root, array $args): \App\Models\Product
    {
        $product = \App\Models\Product::create($args['input']);
        AuditLog::log('create', 'product', $product->id, null, $args['input']);
        return $product;
    }

    public function update($root, array $args): \App\Models\Product
    {
        $product = \App\Models\Product::findOrFail($args['id']);
        $old = $product->toArray();
        $product->update($args['input']);
        AuditLog::log('update', 'product', $product->id, $old, $args['input']);
        return $product;
    }

    public function adjustStock($root, array $args): \App\Models\StockMovement
    {
        $product = \App\Models\Product::findOrFail($args['productId']);
        $qty = $args['type'] === 'salida' ? -abs($args['quantity']) : abs($args['quantity']);
        $product->update(['stock' => $product->stock + $qty]);
        $movement = $product->stockMovements()->create([
            'type' => $args['type'], 'quantity' => $args['quantity'],
            'reason' => $args['reason'] ?? null, 'user_id' => auth()->id(),
        ]);
        AuditLog::log('stock_adjust', 'product', $product->id, null, ['type' => $args['type'], 'quantity' => $args['quantity']]);
        return $movement;
    }
}

class PurchaseOrderMutation
{
    public function create($root, array $args): \App\Models\PurchaseOrder
    {
        $folio = 'OC-' . date('Ymd') . '-' . str_pad(\App\Models\PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT);
        $po = \App\Models\PurchaseOrder::create([...$args['input'], 'folio' => $folio, 'user_id' => auth()->id()]);

        foreach ($args['input']['items'] ?? [] as $item) {
            $po->items()->create($item);
        }
        $po->calculateTotals();
        AuditLog::log('create', 'purchase_order', $po->id);
        return $po;
    }

    public function receivePurchaseOrder($root, array $args): \App\Models\PurchaseOrder
    {
        $po = \App\Models\PurchaseOrder::with('items.product')->findOrFail($args['id']);
        $po->receive();
        AuditLog::log('receive', 'purchase_order', $po->id, null, ['status' => 'recibido']);
        return $po;
    }
}

class EmployeeMutation
{
    public function create($root, array $args): \App\Models\Employee
    {
        $num = 'EMP-' . str_pad(\App\Models\Employee::count() + 1, 4, '0', STR_PAD_LEFT);
        $employee = \App\Models\Employee::create([...$args['input'], 'employee_number' => $num]);
        AuditLog::log('create', 'employee', $employee->id, null, $args['input']);
        return $employee;
    }

    public function clockIn($root, array $args): \App\Models\Attendance
    {
        $employee = \App\Models\Employee::findOrFail($args['employeeId']);
        return $employee->clockIn();
    }

    public function requestLeave($root, array $args): \App\Models\Leave
    {
        $days = now()->parse($args['input']['startDate'])->diffInDays($args['input']['endDate']) + 1;
        $leave = \App\Models\Leave::create([...$args['input'], 'days' => $days]);
        AuditLog::log('request', 'leave', $leave->id);
        return $leave;
    }

    public function approveLeave($root, array $args): \App\Models\Leave
    {
        $leave = \App\Models\Leave::findOrFail($args['id']);
        $leave->update(['status' => 'aprobado', 'approved_by' => auth()->id()]);
        AuditLog::log('approve', 'leave', $leave->id);
        return $leave;
    }

    public function rejectLeave($root, array $args): \App\Models\Leave
    {
        $leave = \App\Models\Leave::findOrFail($args['id']);
        $leave->update(['status' => 'rechazado']);
        return $leave;
    }
}

class TicketMutation
{
    public function create($root, array $args): \App\Models\Ticket
    {
        $sla = match ($args['priority'] ?? 'media') {
            'urgente' => now()->addHours(4),
            'alta' => now()->addHours(8),
            default => now()->addHours(24),
        };
        $ticket = \App\Models\Ticket::create([
            ...$args, 'user_id' => auth()->id(), 'sla_deadline' => $sla,
        ]);
        AuditLog::log('create', 'ticket', $ticket->id);
        return $ticket;
    }
}

class NotificationMutation
{
    public function create($root, array $args): \App\Models\Notification
    {
        return \App\Models\Notification::create($args['input']);
    }

    public function markAllNotificationsRead($root): bool
    {
        \App\Models\Notification::where('user_id', auth()->id())->whereNull('read_at')->update(['read_at' => now()]);
        return true;
    }
}

class ExportMutation
{
    public function __invoke($root, array $args): string
    {
        $type = $args['type'];
        $format = $args['format'];

        $data = match ($type) {
            'clients' => Client::all()->map(fn($c) => [$c->id, $c->name, $c->email, $c->phone, $c->segment, $c->lifetime_value]),
            'products' => \App\Models\Product::all()->map(fn($p) => [$p->id, $p->sku, $p->name, $p->stock, $p->price]),
            'invoices' => Invoice::all()->map(fn($i) => [$i->folio, $i->client->name ?? '', $i->total, $i->status, $i->fecha_emision]),
            'employees' => \App\Models\Employee::all()->map(fn($e) => [$e->employee_number, $e->name, $e->department->name ?? '', $e->position->name ?? '', $e->active ? 'Activo' : 'Inactivo']),
            default => [],
        };

        if ($format === 'csv') {
            $lines = [implode(',', array_keys($data->first()?->toArray() ?? ['data']))];
            foreach ($data as $row) $lines[] = implode(',', (array) $row);
            return implode("\n", $lines);
        }

        return json_encode($data);
    }
}
