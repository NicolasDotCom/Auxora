<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $entitiesPermissions = [
            'ticket' => ['view', 'create', 'edit', 'update status', 'reopen'],
            'customer' => ['view', 'create', 'edit', 'delete'],
            'support' => ['view', 'create', 'edit', 'delete'],
            'api' => ['view', 'manage'],
        ];

        foreach ($entitiesPermissions as $entity => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$action} {$entity}"]);
            }
        }

        $roles = ['admin', 'customer', 'support', 'guest', 'Coordinador'];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

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
            $role->syncPermissions($permissions);
        }

    }
}
