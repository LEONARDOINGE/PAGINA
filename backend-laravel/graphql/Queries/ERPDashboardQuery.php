<?php

namespace App\GraphQL\Queries;

use App\Models\Client;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class ERPDashboardQuery
{
    public function __invoke(): array
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $clientsTotal = Client::count();
        $clientsActive = Client::where('active', true)->count();
        $clientsNewThisMonth = Client::where('created_at', '>=', $startOfMonth)->count();

        $leadsTotal = Lead::count();
        $leadsByStage = Lead::selectRaw('stage, COUNT(*) as count')->groupBy('stage')->get()
            ->map(fn($r) => ['stage' => $r->stage, 'count' => $r->count]);

        $quotesTotal = Quote::count();
        $quotesPending = Quote::whereIn('status', ['borrador', 'enviado'])->count();

        $invoicesTotal = Invoice::sum('total');
        $invoicesPending = Invoice::where('status', 'pendiente')->sum('total');
        $invoicesPaidThisMonth = Invoice::where('status', 'pagado')
            ->where('fecha_pago', '>=', $startOfMonth)->sum('total');

        $productsTotal = Product::count();
        $productsLowStock = Product::lowStock()->count();
        $inventoryValue = Product::selectRaw('SUM(stock * cost) as value')->value('value') ?? 0;

        $employeesTotal = Employee::count();
        $employeesActive = Employee::where('active', true)->count();

        $attendanceToday = DB::table('attendance')->where('date', $now->toDateString())
            ->selectRaw("status, COUNT(*) as count")->groupBy('status')->get();

        $revenueThisMonth = Invoice::where('status', 'pagado')
            ->whereBetween('fecha_pago', [$startOfMonth, $now])->sum('total');
        $revenueLastMonth = Invoice::where('status', 'pagado')
            ->whereBetween('fecha_pago', [$startOfLastMonth, $endOfLastMonth])->sum('total');

        $topProducts = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->where('invoices.status', 'pagado')
            ->selectRaw('products.id, products.name, SUM(invoice_items.quantity) as total_sold, SUM(invoice_items.quantity * invoice_items.price) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')->limit(5)->get()
            ->map(fn($r) => [
                'product' => Product::find($r->id),
                'totalSold' => $r->total_sold,
                'revenue' => $r->revenue,
            ]);

        $topClients = DB::table('invoices')
            ->join('clients', 'invoices.client_id', '=', 'clients.id')
            ->where('invoices.status', 'pagado')
            ->selectRaw('clients.id, SUM(invoices.total) as total_revenue')
            ->groupBy('clients.id')
            ->orderByDesc('total_revenue')->limit(5)->get()
            ->map(fn($r) => [
                'client' => Client::find($r->id),
                'totalRevenue' => $r->total_revenue,
            ]);

        $monthlyRevenue = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $rev = Invoice::where('status', 'pagado')
                ->whereBetween('fecha_pago', [$start, $end])->sum('total');
            $orders = Invoice::where('status', 'pagado')
                ->whereBetween('fecha_pago', [$start, $end])->count();
            $monthlyRevenue[] = [
                'month' => $month->format('M Y'),
                'revenue' => $rev,
                'orders' => $orders,
            ];
        }

        $interesadas = Lead::where('stage', 'nuevo')->count();
        $cotizadas = Lead::where('stage', 'propuesta')->count();
        $apartadas = Lead::whereIn('stage', ['calificado', 'negociacion'])->count();
        $entregadas = Lead::where('stage', 'ganado')->count();
        $totalPipeline = Lead::whereNotIn('stage', ['ganado', 'perdido'])->sum('budget') ?? 0;

        return [
            'clientsTotal' => $clientsTotal,
            'clientsActive' => $clientsActive,
            'clientsNewThisMonth' => $clientsNewThisMonth,
            'leadsTotal' => $leadsTotal,
            'leadsByStage' => $leadsByStage->toArray(),
            'quotesTotal' => $quotesTotal,
            'quotesPending' => $quotesPending,
            'invoicesTotal' => (float) $invoicesTotal,
            'invoicesPending' => (float) $invoicesPending,
            'invoicesPaidThisMonth' => (float) $invoicesPaidThisMonth,
            'ordersTotal' => Invoice::count(),
            'ordersPending' => Invoice::where('status', 'pendiente')->count(),
            'ordersCompleted' => Invoice::where('status', 'pagado')->count(),
            'productsTotal' => $productsTotal,
            'productsLowStock' => $productsLowStock,
            'inventoryValue' => (float) $inventoryValue,
            'employeesTotal' => $employeesTotal,
            'employeesActive' => $employeesActive,
            'attendanceToday' => [
                'presentes' => $attendanceToday->where('status', 'presente')->sum('count'),
                'faltas' => $attendanceToday->where('status', 'falta')->sum('count'),
                'permisos' => $attendanceToday->whereIn('status', ['permiso', 'vacaciones'])->sum('count'),
                'total' => $attendanceToday->sum('count'),
            ],
            'revenueThisMonth' => (float) $revenueThisMonth,
            'revenueLastMonth' => (float) $revenueLastMonth,
            'topProducts' => $topProducts->toArray(),
            'topClients' => $topClients->toArray(),
            'monthlyRevenue' => $monthlyRevenue,
            'pipelineValue' => [
                'interesadas' => $interesadas,
                'cotizadas' => $cotizadas,
                'apartadas' => $apartadas,
                'entregadas' => $entregadas,
                'totalValue' => (float) $totalPipeline,
            ],
        ];
    }
}
