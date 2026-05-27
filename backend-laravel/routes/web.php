<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn() => response()->json(['app' => 'FotoTec API', 'version' => '1.0', 'status' => 'running']));
Route::get('/health', fn() => response()->json(['status' => 'ok']));
