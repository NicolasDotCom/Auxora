<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\Customer::factory(10)->create();
        \App\Models\Support::factory(5)->create();
        \App\Models\Ticket::factory(15)->create();

        // Crear algunos documentos de ejemplo para los primeros tickets
        $tickets = \App\Models\Ticket::take(5)->get();
        foreach ($tickets as $ticket) {
            \App\Models\TicketDocument::factory()->count(rand(1, 3))->create([
                'ticket_id' => $ticket->id
            ]);
        }

        //ejecutar el seeder de roles y permisos
        $this->call(RolesAndPermissionsSeeder::class);

        // Se crea usuario administrador por defecto
        $admin = User::firstOrCreate(
            ['email' => 'auxora.support@gmail.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
            ]
        );

        if (!$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }
    }
}
