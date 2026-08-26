<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Crear permisos
        $entitiesPermissions = [
            'ticket' => ['view', 'create', 'edit', 'update status', 'reopen'],
            'customer' => ['view', 'create', 'edit', 'delete'],
            'support' => ['view', 'create', 'edit', 'delete'],
        ];

        foreach ($entitiesPermissions as $entity => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$action} {$entity}"]); 
            }
        }

        // Crear roles
        $roles = ['admin', 'customer', 'support', 'guest', 'Coordinador'];
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // Asignar permisos a roles
        $rolesPermissions = [
            'admin' => Permission::all()->pluck('name')->toArray(),

            'customer' => [
                'view ticket',
                'create ticket',
                'reopen ticket',
                'view customer',
                'edit customer',
            ],

            'support' => [
                'view ticket',
                'edit ticket',
                'update status ticket',
                'view support',
                'edit support',
                'delete support',
            ],

            'guest' => [
                'view ticket',
                'create ticket',
                'view customer',
                'create customer',
                'edit customer',
                'delete customer',
                'view support',
                'create support',
                'edit support',
                'delete support',
            ],

            'Coordinador' => [
                'view ticket',
                'create ticket',
                'edit ticket',
                'update status ticket',
                'reopen ticket',
                'view customer',
                'create customer',
                'edit customer',
                'view support',
                'create support',
                'edit support',
            ],
        ];

        foreach ($rolesPermissions as $roleName => $permissions) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->syncPermissions($permissions);
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Quitar permisos de roles y eliminar roles/permissions creados
        $roles = ['admin', 'customer', 'support', 'guest', 'Coordinador'];

        foreach ($roles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->detach();
                $role->delete();
            }
        }

        $permissions = [
            'view ticket', 'create ticket', 'edit ticket', 'update status ticket', 'reopen ticket',
            'view customer', 'create customer', 'edit customer', 'delete customer',
            'view support', 'create support', 'edit support', 'delete support',
        ];

        foreach ($permissions as $permissionName) {
            $perm = Permission::where('name', $permissionName)->first();
            if ($perm) {
                $perm->delete();
            }
        }
    }
};
