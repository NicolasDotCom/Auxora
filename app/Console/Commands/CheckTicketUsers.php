<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckTicketUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:check-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar nombres de usuarios en tickets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tickets = \App\Models\Ticket::with('user')->get();

        foreach ($tickets as $ticket) {
            $userName = $ticket->user ? $ticket->user->name : 'Sin usuario';
            $this->info("Ticket #{$ticket->id} - Creado por: {$userName}");
        }
    }
}
