<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class Policy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super_admin')) return true;
        return null;
    }
}

class ClientPolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('access_crm'); }
    public function create(User $user) { return $user->hasPermissionTo('manage_crm'); }
    public function update(User $user) { return $user->hasPermissionTo('manage_crm'); }
    public function delete(User $user) { return $user->hasRole('super_admin'); }
}

class ProductPolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('access_scm'); }
    public function create(User $user) { return $user->hasPermissionTo('manage_scm'); }
    public function update(User $user) { return $user->hasPermissionTo('manage_scm'); }
    public function delete(User $user) { return $user->hasRole('super_admin'); }
}

class EmployeePolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('access_rh'); }
    public function create(User $user) { return $user->hasPermissionTo('manage_rh'); }
    public function update(User $user) { return $user->hasPermissionTo('manage_rh'); }
    public function delete(User $user) { return $user->hasRole('super_admin'); }
}

class InvoicePolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('access_crm'); }
    public function create(User $user) { return $user->hasPermissionTo('manage_crm'); }
    public function update(User $user) { return $user->hasPermissionTo('manage_crm'); }
}

class UserPolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('manage_users'); }
    public function create(User $user) { return $user->hasPermissionTo('manage_users'); }
    public function update(User $user) { return $user->hasRole('super_admin'); }
}

class DashboardPolicy extends Policy
{
    public function viewAny(User $user) { return $user->hasPermissionTo('view_dashboard'); }
}
