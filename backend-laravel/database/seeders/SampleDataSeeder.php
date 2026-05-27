<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $empDept1 = DB::table('departments')->where('code', 'RRHH')->value('id');
        $empDept2 = DB::table('departments')->where('code', 'VEN')->value('id');
        $pos1 = DB::table('positions')->where('name', 'Coordinador RH')->value('id');
        $pos2 = DB::table('positions')->where('name', 'Gerente de Ventas')->value('id');

        $employees = [
            ['department_id' => $empDept1, 'position_id' => $pos1, 'employee_number' => 'EMP-0001', 'name' => 'Sofia Hernandez', 'email' => 'sofia@fototec.com', 'phone' => '8991110001', 'hire_date' => '2022-01-15', 'salary' => 28000, 'active' => true],
            ['department_id' => $empDept2, 'position_id' => $pos2, 'employee_number' => 'EMP-0002', 'name' => 'Miguel Torres', 'email' => 'miguel@fototec.com', 'phone' => '8991110002', 'hire_date' => '2021-06-01', 'salary' => 35000, 'active' => true],
            ['department_id' => $empDept2, 'position_id' => DB::table('positions')->where('name', 'Ejecutivo de Ventas')->value('id'), 'employee_number' => 'EMP-0003', 'name' => 'Ana Lopez', 'email' => 'ana@fototec.com', 'phone' => '8991110003', 'hire_date' => '2023-03-10', 'salary' => 18000, 'active' => true],
            ['department_id' => DB::table('departments')->where('code', 'OPE')->value('id'), 'position_id' => DB::table('positions')->where('name', 'Coordinador SCM')->value('id'), 'employee_number' => 'EMP-0004', 'name' => 'Carlos Ruiz', 'email' => 'carlos.r@fototec.com', 'phone' => '8991110004', 'hire_date' => '2022-08-20', 'salary' => 30000, 'active' => true],
            ['department_id' => DB::table('departments')->where('code', 'OPE')->value('id'), 'position_id' => DB::table('positions')->where('name', 'Auxiliar de Almacen')->value('id'), 'employee_number' => 'EMP-0005', 'name' => 'Pedro Sanchez', 'email' => 'pedro@fototec.com', 'phone' => '8991110005', 'hire_date' => '2023-09-01', 'salary' => 12000, 'active' => true],
        ];

        foreach ($employees as $e) DB::table('employees')->insert($e);

        $users = [
            ['name' => 'Sofia Hernandez', 'email' => 'sofia@fototec.com', 'password' => bcrypt('password'), 'employee_id' => 1, 'active' => true],
            ['name' => 'Miguel Torres', 'email' => 'miguel@fototec.com', 'password' => bcrypt('password'), 'employee_id' => 2, 'active' => true],
            ['name' => 'Ana Lopez', 'email' => 'ana@fototec.com', 'password' => bcrypt('password'), 'employee_id' => 3, 'active' => true],
        ];

        foreach ($users as $i => $u) {
            $uid = DB::table('users')->insertGetId($u);
            DB::table('model_has_roles')->insert(['role_type' => 'App\Models\User', 'role_id' => $i === 0 ? 4 : ($i === 1 ? 2 : 5), 'model_type' => 'App\Models\User', 'model_id' => $uid]);
        }

        $settings = [
            ['key' => 'company_name', 'value' => 'FotoTec Studio', 'group' => 'company', 'type' => 'string'],
            ['key' => 'company_rfc', 'value' => 'FOT260101XXX', 'group' => 'company', 'type' => 'string'],
            ['key' => 'company_address', 'value' => 'Av. Mexico #100, Reynosa, Tamaulipas', 'group' => 'company', 'type' => 'string'],
            ['key' => 'iva_rate', 'value' => '16', 'group' => 'finance', 'type' => 'string'],
            ['key' => 'currency', 'value' => 'MXN', 'group' => 'finance', 'type' => 'string'],
            ['key' => 'low_stock_threshold', 'value' => '10', 'group' => 'inventory', 'type' => 'string'],
            ['key' => 'session_duration', 'value' => '60', 'group' => 'crm', 'type' => 'string'],
        ];

        foreach ($settings as $s) DB::table('settings')->insert($s);
    }
}
