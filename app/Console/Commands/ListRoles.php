<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ListRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'role:list {--role=} {--permissions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all roles and their permissions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $specificRole = $this->option('role');
        $showPermissions = $this->option('permissions');

        if ($specificRole) {
            // Mostrar información de un rol específico
            $role = Role::where('name', $specificRole)->first();
            
            if (!$role) {
                $this->error("Rol '{$specificRole}' no encontrado.");
                return 1;
            }

            $this->info("Rol: {$role->name}");
            $this->info("Permisos:");
            foreach ($role->permissions as $permission) {
                $this->line("- {$permission->name}");
            }
        } elseif ($showPermissions) {
            // Mostrar todos los permisos disponibles
            $this->info("Permisos disponibles en el sistema:");
            $permissions = Permission::all()->pluck('name');
            foreach ($permissions as $permission) {
                $this->line("- {$permission}");
            }
        } else {
            // Mostrar todos los roles con sus permisos
            $roles = Role::with('permissions')->get();
            
            $this->info("Roles y Permisos en el sistema:");
            $this->line("");
            
            foreach ($roles as $role) {
                $this->line("📋 <fg=yellow>{$role->name}</fg=yellow>");
                if ($role->permissions->count() > 0) {
                    foreach ($role->permissions as $permission) {
                        $this->line("   ✓ {$permission->name}");
                    }
                } else {
                    $this->line("   <fg=red>Sin permisos asignados</fg=red>");
                }
                $this->line("");
            }

            $this->line("Comandos útiles:");
            $this->line("php artisan role:list --role=nombre_rol     # Ver permisos de un rol específico");
            $this->line("php artisan role:list --permissions        # Ver todos los permisos disponibles");
            $this->line("php artisan role:create nombre_rol         # Crear nuevo rol");
        }

        return 0;
    }
}
