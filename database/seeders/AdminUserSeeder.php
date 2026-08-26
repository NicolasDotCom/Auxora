<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuario administrador
        $adminUser = User::firstOrCreate(
            ['email' => 'auxora.support@gmail.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol de admin
        $adminRole = Role::where('name', 'admin')->first();

        if ($adminRole && !$adminUser->hasRole('admin')) {
            $adminUser->assignRole($adminRole);
        }

        $this->command->info('Usuario administrador creado:');
        $this->command->info('Email: auxora.support@gmail.com');
        $this->command->info('Password: password');
    }
}
