<?php

return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'deprecations' => ['channel' => null, 'trace' => false],
    'channels' => [
        'stack' => ['driver' => 'stack', 'channels' => ['single'], 'ignore_exceptions' => false],
        'single' => ['driver' => 'single', 'path' => storage_path('logs/laravel.log'), 'level' => 'debug'],
        'stderr' => ['driver' => 'monolog', 'level' => 'debug', 'handler' => \Monolog\Handler\StreamHandler::class, 'formatter' => env('LOG_STDERR_FORMATTER'), 'with' => ['stream' => 'php://stderr']],
    ],
];
