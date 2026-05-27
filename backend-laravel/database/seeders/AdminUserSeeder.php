<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Administrador',
            'email' => 'admin@fototec.com',
            'password' => Hash::make('admin123'),
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('model_has_roles')->insert(['role_type' => 'App\Models\User', 'role_id' => 1, 'model_type' => 'App\Models\User', 'model_id' => $userId]);
    }
}
