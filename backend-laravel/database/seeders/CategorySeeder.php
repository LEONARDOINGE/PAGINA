<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Sesiones Fotograficas', 'icon' => 'camera', 'description' => 'Paquetes de sesiones fotograficas'],
            ['name' => 'Impresiones', 'icon' => 'printer', 'description' => 'Impresiones y marcos'],
            ['name' => 'Albumes', 'icon' => 'book', 'description' => 'Albumes y photobooks'],
            ['name' => 'Eventos', 'icon' => 'calendar', 'description' => 'Cobertura de eventos'],
            ['name' => 'Retoque', 'icon' => 'wand', 'description' => 'Servicios de edicion y retoque'],
            ['name' => 'Insumos', 'icon' => 'box', 'description' => 'Materiales y consumibles'],
            ['name' => 'Equipo', 'icon' => 'lens', 'description' => 'Camaras, lentes, iluminacion'],
        ];

        foreach ($categories as $c) DB::table('categories')->insert($c);

        $products = [
            ['category_id' => 1, 'sku' => 'SES-001', 'name' => 'Sesion Retrato Basica', 'price' => 1500, 'cost' => 300, 'stock' => 999, 'stock_min' => 1, 'type' => 'servicio'],
            ['category_id' => 1, 'sku' => 'SES-002', 'name' => 'Sesion Retrato Premium', 'price' => 3500, 'cost' => 500, 'stock' => 999, 'stock_min' => 1, 'type' => 'servicio'],
            ['category_id' => 1, 'sku' => 'SES-003', 'name' => 'Sesion Familiar', 'price' => 2800, 'cost' => 400, 'stock' => 999, 'stock_min' => 1, 'type' => 'servicio'],
            ['category_id' => 1, 'sku' => 'SES-004', 'name' => 'Sesion Empresarial', 'price' => 5000, 'cost' => 800, 'stock' => 999, 'stock_min' => 1, 'type' => 'servicio'],
            ['category_id' => 1, 'sku' => 'SES-005', 'name' => 'Boda Completa', 'price' => 25000, 'cost' => 5000, 'stock' => 999, 'stock_min' => 1, 'type' => 'servicio'],
            ['category_id' => 2, 'sku' => 'IMP-001', 'name' => 'Impresion 8x10', 'price' => 120, 'cost' => 25, 'stock' => 500, 'stock_min' => 50, 'unit' => 'pza', 'type' => 'producto'],
            ['category_id' => 2, 'sku' => 'IMP-002', 'name' => 'Impresion 16x20', 'price' => 250, 'cost' => 50, 'stock' => 300, 'stock_min' => 30, 'unit' => 'pza', 'type' => 'producto'],
            ['category_id' => 2, 'sku' => 'IMP-003', 'name' => 'Lienzo 60x90', 'price' => 1800, 'cost' => 400, 'stock' => 20, 'stock_min' => 5, 'unit' => 'pza', 'type' => 'producto'],
            ['category_id' => 3, 'sku' => 'ALB-001', 'name' => 'Photobook 20 paginas', 'price' => 2200, 'cost' => 600, 'stock' => 15, 'stock_min' => 5, 'type' => 'producto'],
            ['category_id' => 6, 'sku' => 'PAP-001', 'name' => 'Papel Fotografico 100 hojas', 'price' => 450, 'cost' => 200, 'stock' => 30, 'stock_min' => 10, 'unit' => 'paq', 'type' => 'insumo'],
            ['category_id' => 6, 'sku' => 'TIN-001', 'name' => 'Tinta EPSON L3250', 'price' => 1200, 'cost' => 700, 'stock' => 8, 'stock_min' => 5, 'unit' => 'jgo', 'type' => 'insumo'],
            ['category_id' => 7, 'sku' => 'EQU-001', 'name' => 'Flash Externo Yongnuo', 'price' => 3500, 'cost' => 1800, 'stock' => 3, 'stock_min' => 2, 'unit' => 'pza', 'type' => 'equipo'],
        ];

        foreach ($products as $p) DB::table('products')->insert($p);

        $suppliers = [
            ['name' => 'Distribuidora Fotografica del Norte', 'contact_name' => 'Carlos Mendoza', 'email' => 'carlos@distfon.mx', 'phone' => '8991234567', 'category' => 'insumos', 'rating' => 4.5, 'payment_terms' => '30 dias', 'lead_time_days' => 5],
            ['name' => 'ProCam Mexico', 'contact_name' => 'Laura Garcia', 'email' => 'ventas@procam.mx', 'phone' => '5551234567', 'category' => 'equipo', 'rating' => 4.8, 'payment_terms' => '60 dias', 'lead_time_days' => 10],
            ['name' => 'Impresiones Reynosa', 'contact_name' => 'Roberto Perez', 'email' => 'roberto@imp-rey.mx', 'phone' => '8997654321', 'category' => 'papeleria', 'rating' => 4.0, 'payment_terms' => '15 dias', 'lead_time_days' => 3],
            ['name' => 'TechLens SA de CV', 'contact_name' => 'Ana Martinez', 'email' => 'ana@techlens.mx', 'phone' => '8712345678', 'category' => 'equipo', 'rating' => 4.6, 'payment_terms' => '45 dias', 'lead_time_days' => 7],
        ];

        foreach ($suppliers as $s) DB::table('suppliers')->insert($s);

        $clients = [
            ['name' => 'Grupo Industrial Reynosa', 'email' => 'contacto@gir.com.mx', 'phone' => '8991112233', 'company' => 'Grupo Industrial Reynosa', 'rfc' => 'GIR990101XXX', 'segment' => 'corporate', 'lead_source' => 'referido', 'lifetime_value' => 45000, 'city' => 'Reynosa', 'state' => 'Tamaulipas'],
            ['name' => 'Maria Elena Gonzalez', 'email' => 'maria.glez@gmail.com', 'phone' => '8992223344', 'segment' => 'vip', 'lead_source' => 'facebook', 'lifetime_value' => 28000, 'city' => 'Reynosa', 'state' => 'Tamaulipas'],
            ['name' => 'Clinica Dental Sonrisa', 'email' => 'info@clinica-sonrisa.mx', 'phone' => '8993334455', 'company' => 'Clinica Dental Sonrisa', 'rfc' => 'CSO190101YYZ', 'segment' => 'corporate', 'lead_source' => 'google', 'lifetime_value' => 18000, 'city' => 'Reynosa', 'state' => 'Tamaulipas'],
            ['name' => 'Jose Luis Ramirez', 'email' => 'jlramirez@yahoo.com', 'phone' => '8994445566', 'segment' => 'regular', 'lead_source' => 'whatsapp', 'lifetime_value' => 5500, 'city' => 'McAllen', 'state' => 'Texas'],
            ['name' => 'Escuela Modelo', 'email' => 'direccion@escuelamodelo.edu.mx', 'phone' => '8995556677', 'company' => 'Escuela Modelo AC', 'rfc' => 'EMO880101ZZZ', 'segment' => 'corporate', 'lead_source' => 'referido', 'lifetime_value' => 65000, 'city' => 'Reynosa', 'state' => 'Tamaulipas'],
        ];

        foreach ($clients as $c) DB::table('clients')->insert($c);
    }
}
