<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Direccion General', 'code' => 'DIR', 'color' => '#7c3aed', 'cost_center' => 'CC-001'],
            ['name' => 'Ventas y CRM', 'code' => 'VEN', 'color' => '#2563eb', 'cost_center' => 'CC-002'],
            ['name' => 'Operaciones (SCM)', 'code' => 'OPE', 'color' => '#059669', 'cost_center' => 'CC-003'],
            ['name' => 'Recursos Humanos', 'code' => 'RRHH', 'color' => '#dc2626', 'cost_center' => 'CC-004'],
            ['name' => 'Finanzas y ERP', 'code' => 'FIN', 'color' => '#d97706', 'cost_center' => 'CC-005'],
            ['name' => 'Marketing', 'code' => 'MKT', 'color' => '#db2777', 'cost_center' => 'CC-006'],
        ];

        foreach ($departments as $d) DB::table('departments')->insert($d);

        $positions = [
            ['department_id' => 1, 'name' => 'Director General', 'level' => 'top', 'min_salary' => 50000, 'max_salary' => 80000],
            ['department_id' => 2, 'name' => 'Gerente de Ventas', 'level' => 'senior', 'min_salary' => 30000, 'max_salary' => 50000],
            ['department_id' => 2, 'name' => 'Ejecutivo de Ventas', 'level' => 'mid', 'min_salary' => 15000, 'max_salary' => 25000],
            ['department_id' => 3, 'name' => 'Coordinador SCM', 'level' => 'senior', 'min_salary' => 25000, 'max_salary' => 40000],
            ['department_id' => 3, 'name' => 'Auxiliar de Almacen', 'level' => 'junior', 'min_salary' => 10000, 'max_salary' => 15000],
            ['department_id' => 4, 'name' => 'Coordinador RH', 'level' => 'senior', 'min_salary' => 25000, 'max_salary' => 40000],
            ['department_id' => 4, 'name' => 'Auxiliar de Nomina', 'level' => 'junior', 'min_salary' => 12000, 'max_salary' => 18000],
            ['department_id' => 5, 'name' => 'Contador General', 'level' => 'senior', 'min_salary' => 30000, 'max_salary' => 50000],
            ['department_id' => 6, 'name' => 'Community Manager', 'level' => 'mid', 'min_salary' => 15000, 'max_salary' => 22000],
        ];

        foreach ($positions as $p) DB::table('positions')->insert($p);
    }
}
