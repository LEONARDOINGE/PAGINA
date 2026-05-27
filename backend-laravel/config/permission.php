<?php

return [
    'models' => [],
    'roles_table' => 'roles',
    'role_has_permissions_table' => 'role_has_permissions',
    'permissions_table' => 'permissions',
    'model_has_roles_table' => 'model_has_roles',
    'model_has_permissions_table' => 'model_has_permissions',
    'teams' => false,
    'team_permission' => false,
    'team_models' => [],
    'use_passport_client_credentials' => false,
    'expiration_seconds' => 10800,
    'cache' => ['store' => 'array', 'expiration_time' => 3600],
];
