<?php

return [
    'cache' => env('LIGHTHOUSE_CACHE', env('CACHE_DRIVER', 'array')),
    'debug' => env('LIGHTHOUSE_DEBUG', env('APP_DEBUG', false)),
    'guard' => env('LIGHTHOUSE_GUARD', 'sanctum'),
    'schema' => base_path('graphql/schema.graphql'),
    'routes' => env('LIGHTHOUSE_ROUTES', 'graphql'),
    'route_prefix' => '',
    'group_options' => [],
    'namespaces' => [
        'models' => ['App\\Models'],
        'queries' => ['App\\GraphQL\\Queries'],
        'mutations' => ['App\\GraphQL\\Mutations'],
        'subscriptions' => ['App\\GraphQL\\Subscriptions'],
        'types' => ['App\\GraphQL\\Types'],
        'scalars' => ['App\\GraphQL\\Scalars'],
        'directives' => ['App\\GraphQL\\Directives'],
        'middleware' => [],
    ],
    'pagination' => ['default' => 'paginator', 'max_count' => 100],
    'festival' => [],
    'transactional_mutations' => true,
    'validate_schema' => env('LIGHTHOUSE_VALIDATE_SCHEMA', true),
    'security' => [
        'max_query_complexity' => 500,
        'max_query_depth' => 15,
        'max_page_size' => 100,
    ],
    'slow_query' => ['threshold' => 0],
    'unions' => [],
    'interfaces' => [],
];
