<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\TursoSyncService::class, function ($app) {
            return new \App\Services\TursoSyncService();
        });
    }

    public function boot(): void
    {
        //
    }
}
