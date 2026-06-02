<?php

use Illuminate\Support\Facades\Route;
use Nuwave\Lighthouse\Facades\GraphQL;

Route::get('/', fn() => response()->json(['app' => 'FotoTec API', 'version' => '1.0', 'status' => 'running']));
Route::get('/health', fn() => response()->json(['status' => 'ok']));

Route::post('/graphql', function () {
    return GraphQL::executeQuery(
        request()->input('query'),
        request()->input('variables', []),
        context: request()
    )->toArray();
});

Route::get('/graphql', function () {
    return GraphQL::executeQuery(
        request()->input('query', '{ __typename }'),
        request()->input('variables', []),
        context: request()
    )->toArray();
});
