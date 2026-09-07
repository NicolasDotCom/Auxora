<?php

namespace Database\Seeders;

use App\Http\Controllers\DemoController;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketCommentAttachment;
use App\Models\TicketDocument;
use App\Models\TicketHistory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Siembra los 4 usuarios demo (uno por rol) + datos de ejemplo
 * (clientes, técnicos, tickets, comentarios, adjuntos dummy) para
 * que el visitante del portafolio vea una app "viva" desde el primer click.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Sembrando datos demo...');

        // 1) Asegurar roles base + permisos (idempotente)
        $this->call(RolesAndPermissionsSeeder::class);

        // 2) Limpiar tickets y derivados para que el reset sea determinista.
        //    NO tocar users (se preservan los admins reales + los 4 demo).
        DB::table('ticket_comment_attachments')->delete();
        DB::table('ticket_comments')->delete();
        DB::table('ticket_documents')->delete();
        DB::table('ticket_histories')->delete();
        DB::table('pending_parts')->delete();
        DB::table('tickets')->delete();

        // 3) Catálogos: clientes y técnicos ficticios
        $this->seedCustomers();
        $this->seedSupports();

        // 4) Crear / actualizar los 4 usuarios demo
        $demoUsers = $this->seedDemoUsers();

        // 5) Tickets de ejemplo asignados a los técnicos / clientes demo
        $this->seedTickets($demoUsers);

        $this->command->info('✅ Datos demo listos.');
        $this->command->info('   1-click login:  /welcome');
        $this->command->info('   Credenciales backup (no necesarias en demo):');
        foreach (DemoController::DEMO_ROLES as $slug => $info) {
            $this->command->info("     {$slug}: {$info['email']} / demo1234");
        }
    }

    private function seedDemoUsers(): array
    {
        $users = [];

        foreach (DemoController::DEMO_ROLES as $roleSlug => $info) {
            $user = User::updateOrCreate(
                ['email' => $info['email']],
                [
                    'name' => $info['label'],
                    'password' => Hash::make('demo1234'),
                    'email_verified_at' => now(),
                    'ciudad' => 'Demo City',
                ],
            );

            if (! $user->hasRole($roleSlug)) {
                $user->assignRole($roleSlug);
            }

            // Si es cliente, crear su registro en customers
            if ($roleSlug === 'customer') {
                \App\Models\Customer::updateOrCreate(
                    ['email' => $user->email],
                    [
                        'name' => 'Empresa Demo S.A.',
                        'name_user' => $user->name,
                        'phone' => '+34 900 000 000',
                    ],
                );
            }

            $users[$roleSlug] = $user;
        }

        return $users;
    }

    private function seedCustomers(): void
    {
        $customers = [
            ['Tecnología del Norte S.L.', 'contacto@norte-tech.example', 'Marta García', '+34 944 111 222'],
            ['Distribuidora Sur S.A.',  'soporte@sur-dist.example',   'Javier López',  '+34 955 333 444'],
            ['Industrias Centro',         'it@centro-ind.example',       'Laura Pérez',   '+34 911 555 666'],
            ['Logística Este',            'sistemas@este-log.example',   'Diego Ruiz',    '+34 966 777 888'],
            ['Servicios Oeste',           'admin@oeste-serv.example',    'Ana Martínez',  '+34 981 999 000'],
        ];

        foreach ($customers as [$name, $email, $nameUser, $phone]) {
            \App\Models\Customer::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'name_user' => $nameUser, 'phone' => $phone],
            );
        }
    }

    private function seedSupports(): void
    {
        $supports = [
            ['Carlos Méndez', 'carlos@auxora.demo',   '+34 600 111 222', 'Sistemas'],
            ['Lucía Fernández','lucia@auxora.demo',  '+34 600 333 444', 'Sistemas'],
            ['Sergio Romero',  'sergio@auxora.demo',  '+34 600 555 666', 'Impresoras'],
        ];

        foreach ($supports as [$name, $email, $phone, $spec]) {
            \App\Models\Support::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'phone' => $phone, 'speciality' => $spec],
            );
        }
    }

    private function seedTickets(array $users): void
    {
        $customers = \App\Models\Customer::all();
        $supports  = \App\Models\Support::all();
        $admin     = $users['admin'];
        $support   = $users['support'];
        $customer  = $users['customer'];

        // subject (enum) + título libre (se concatena a la descripción)
        $subjects = [
            ['Mantenimiento Preventivo', 'Equipo no enciende tras actualización'],
            ['Configuración ó Escaner', 'Error de impresión en red'],
            ['Código de Error',         'Pantalla azul intermitente'],
            ['Remoto',                  'Acceso denegado a carpeta compartida'],
            ['Otros',                   'Lentitud extrema en aplicaciones ofimáticas'],
            ['Otros',                   'Monitor sin señal'],
            ['Otros',                   'Teclado inalámbrico no responde'],
            ['Otros',                   'Cámara web no detectada'],
            ['Servicio de Ingeniería',  'VPN se desconecta cada 5 minutos'],
            ['Otros',                   'Backup programado falla'],
        ];

        $descriptions = [
            'Tras la última actualización de firmware el equipo no responde. Ya probé reinicio forzado.',
            'Los equipos del departamento comercial no imprimen desde la actualización de Windows.',
            'BSOD con código CRITICAL_PROCESS_DIED, aparece 3-4 veces al día.',
            'Algunos usuarios no pueden acceder a la carpeta compartida del servidor.',
            'Word y Excel tardan más de 30s en abrir cualquier documento.',
            'El monitor se queda sin señal al sacar el equipo de suspensión.',
            'El teclado dejó de responder, probé pilas nuevas y reseteo del dongle.',
            'La cámara no aparece en Teams ni en Zoom.',
            'La VPN corporativa se cae cada pocos minutos, log de errores adjunto.',
            'El backup nocturno a las 02:00 está fallando desde hace 3 días.',
        ];

        $statuses = [
            'Open',        // 4 abiertos
            'Open',
            'Open',
            'Open',
            'In Progress', // 3 en progreso
            'In Progress',
            'In Progress',
            'Closed',      // 3 cerrados
            'Closed',
            'Closed',
        ];

        foreach ($subjects as $i => [$subjectEnum, $title]) {
            $ticket = Ticket::create([
                'user_id'         => $admin->id,
                'customer_id'     => $customers->random()->id,
                'support_id'      => $supports->random()->id,
                'subject'         => $subjectEnum,
                'description'     => "**{$title}**\n\n{$descriptions[$i]}",
                'status'          => $statuses[$i],
                'phone'           => '+34 900 000 000',
                'nombre_contacto' => $customers->random()->name_user,
                'address'         => 'C/ Demo ' . ($i + 1) . ', Madrid',
                'brand'           => collect(['HP', 'Dell', 'Lenovo', 'Asus'])->random(),
                'model'           => collect(['ProBook 450', 'Latitude 5420', 'ThinkPad T14', 'ZenBook'])->random(),
                'serial'          => strtoupper('SN' . str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT)),
                'ciudad'          => collect(['Madrid', 'Barcelona', 'Valencia', 'Sevilla'])->random(),
                'assigned_at'     => $statuses[$i] !== 'Open' ? now()->subDays(rand(1, 5)) : null,
                'closed_at'       => $statuses[$i] === 'Closed' ? now()->subDays(rand(0, 2)) : null,
            ]);

            // Historial: creación
            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'user_id'     => $admin->id,
                'action'      => 'created',
                'description' => 'Ticket creado desde seeder demo.',
            ]);

            // 1-3 comentarios según estado
            $commentCount = $statuses[$i] === 'Closed' ? rand(2, 3) : rand(0, 2);
            for ($c = 0; $c < $commentCount; $c++) {
                $comment = TicketComment::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $c % 2 === 0 ? $support->id : $admin->id,
                    'comment'   => collect([
                        'Revisado el equipo en remoto, parece problema de drivers.',
                        'Necesitamos acceso presencial para cambiar la placa base.',
                        'Resuelto reinstalando el driver de red.',
                        'Cliente confirma que ya funciona correctamente.',
                    ])->random(),
                ]);

                // Adjunto dummy en algunos comentarios
                if (random_int(0, 1) === 1) {
                    TicketCommentAttachment::create([
                        'ticket_comment_id' => $comment->id,
                        'file_name'         => 'captura-' . ($c + 1) . '.txt',
                        'file_path'         => 'comment-attachments/demo/' . $ticket->id . '/' . uniqid() . '.txt',
                        'mime_type'         => 'text/plain',
                        'file_size'         => random_int(800, 8000),
                    ]);
                }
            }
        }
    }
}