<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Eliminar el permiso mal nombrado (segunda palabra era 'ticket', caía en grupo Ticket)
        Permission::where('name', 'view ticket analytics')->delete();

        // Crear con nombre correcto (segunda palabra 'analytics' → grupo Análisis)
        Permission::firstOrCreate(['name' => 'stats analytics']);

        $admin = Role::findByName('admin');
        if ($admin) {
            $admin->givePermissionTo('stats analytics');
        }
    }

    public function down(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::where('name', 'stats analytics')->delete();
    }
};
