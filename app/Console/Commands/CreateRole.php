<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CreateRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'role:create {name} {--permissions=*}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new role with specified permissions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $roleName = $this->argument('name');
        $permissions = $this->option('permissions');

        // Crear el rol
        $role = Role::firstOrCreate(['name' => $roleName]);
        
        if ($role->wasRecentlyCreated) {
            $this->info("Rol '{$roleName}' creado exitosamente.");
        } else {
            $this->info("Rol '{$roleName}' ya existe. Actualizando permisos...");
        }

        // Si se especificaron permisos
        if (!empty($permissions)) {
            // Verificar que todos los permisos existen
            $existingPermissions = Permission::whereIn('name', $permissions)->pluck('name')->toArray();
            $missingPermissions = array_diff($permissions, $existingPermissions);

            if (!empty($missingPermissions)) {
                $this->error("Los siguientes permisos no existen:");
                foreach ($missingPermissions as $permission) {
                    $this->line("- {$permission}");
                }
                return 1;
            }

            // Asignar permisos al rol
            $role->syncPermissions($permissions);
            $this->info("Permisos asignados al rol '{$roleName}':");
            foreach ($permissions as $permission) {
                $this->line("- {$permission}");
            }
        } else {
            // Mostrar permisos disponibles
            $this->info("Permisos disponibles en el sistema:");
            $allPermissions = Permission::all()->pluck('name');
            foreach ($allPermissions as $permission) {
                $this->line("- {$permission}");
            }
            $this->line("\nPara asignar permisos usa:");
            $this->line("php artisan role:create {$roleName} --permissions=\"view ticket\" --permissions=\"create ticket\"");
        }

        // Limpiar cache de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        $this->info("Cache de permisos limpiada.");

        return 0;
    }
}
