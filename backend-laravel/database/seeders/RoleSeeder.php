<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'super_admin', 'guard_name' => 'web'],
            ['name' => 'gerente_ventas', 'guard_name' => 'web'],
            ['name' => 'coordinador_scm', 'guard_name' => 'web'],
            ['name' => 'coordinador_rrhh', 'guard_name' => 'web'],
            ['name' => 'empleado', 'guard_name' => 'web'],
            ['name' => 'cliente', 'guard_name' => 'web'],
        ];

        foreach ($roles as $r) DB::table('roles')->insert($r);

        $permissions = [
            'access_crm', 'manage_crm', 'access_scm', 'manage_scm',
            'access_rh', 'manage_rh', 'access_erp', 'manage_erp',
            'access_reports', 'manage_users', 'manage_settings',
            'manage_inventory', 'view_dashboard', 'export_data',
        ];

        foreach ($permissions as $p) DB::table('permissions')->insert(['name' => $p, 'guard_name' => 'web']);

        DB::table('role_has_permissions')->insert([
            ['role_id' => 1, 'permission_id' => 1],
            ['role_id' => 1, 'permission_id' => 2],
            ['role_id' => 1, 'permission_id' => 3],
            ['role_id' => 1, 'permission_id' => 4],
            ['role_id' => 1, 'permission_id' => 5],
            ['role_id' => 1, 'permission_id' => 6],
            ['role_id' => 1, 'permission_id' => 7],
            ['role_id' => 1, 'permission_id' => 8],
            ['role_id' => 1, 'permission_id' => 9],
            ['role_id' => 1, 'permission_id' => 10],
            ['role_id' => 2, 'permission_id' => 1],
            ['role_id' => 2, 'permission_id' => 9],
            ['role_id' => 2, 'permission_id' => 12],
            ['role_id' => 3, 'permission_id' => 3],
            ['role_id' => 3, 'permission_id' => 4],
            ['role_id' => 3, 'permission_id' => 9],
            ['role_id' => 3, 'permission_id' => 11],
            ['role_id' => 4, 'permission_id' => 5],
            ['role_id' => 4, 'permission_id' => 6],
            ['role_id' => 4, 'permission_id' => 9],
            ['role_id' => 5, 'permission_id' => 12],
        ]);
    }
}
