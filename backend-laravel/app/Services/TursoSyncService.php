<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TursoSyncService
{
    private string $url;
    private string $token;

    public function __construct()
    {
        $this->url = env('TURSO_URL', 'https://api.turso.io');
        $this->token = env('TURSO_AUTH_TOKEN', '');
    }

    public function push(): array
    {
        if (empty($this->token)) {
            return ['success' => false, 'message' => 'TURSO_AUTH_TOKEN no configurado'];
        }

        try {
            $tables = ['clients', 'products', 'invoices', 'employees', 'suppliers', 'departments'];
            $results = [];

            foreach ($tables as $table) {
                $data = DB::table($table)->get()->toArray();
                if (empty($data)) continue;

                $response = Http::withToken($this->token)
                    ->post("{$this->url}/v2/pipeline", [
                        'statements' => array_map(fn($row) => [
                            'type' => 'execute',
                            'stmt' => [
                                'sql' => "INSERT OR REPLACE INTO {$table} VALUES (" .
                                    implode(',', array_fill(0, count((array)$row), '?')) . ")",
                                'args' => array_values((array) $row),
                            ],
                        ], $data),
                    ]);

                $results[$table] = $response->successful();
            }

            return ['success' => true, 'synced' => $results, 'message' => 'Sincronizado a Turso exitosamente'];
        } catch (\Exception $e) {
            Log::error('Turso sync error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    public function pull(): array
    {
        if (empty($this->token)) {
            return ['success' => false, 'message' => 'TURSO_AUTH_TOKEN no configurado'];
        }

        try {
            $tables = ['settings', 'categories'];
            $results = [];

            foreach ($tables as $table) {
                $response = Http::withToken($this->token)
                    ->get("{$this->url}/v2/query", [
                        'statements' => [['sql' => "SELECT * FROM {$table}"]],
                    ]);

                if ($response->successful()) {
                    $rows = $response->json('result.0.rows', []);
                    foreach ($rows as $row) {
                        DB::table($table)->updateOrInsert(
                            ['id' => $row['id']],
                            (array) $row
                        );
                    }
                    $results[$table] = count($rows);
                }
            }

            return ['success' => true, 'pulled' => $results, 'message' => 'Datos traidos de Turso'];
        } catch (\Exception $e) {
            Log::error('Turso pull error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}
