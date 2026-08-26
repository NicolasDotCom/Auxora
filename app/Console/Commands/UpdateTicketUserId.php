<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateTicketUserId extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:update-user-id';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar user_id de tickets basándose en el email del customer';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tickets = \App\Models\Ticket::with('customer')->get();
        $updated = 0;

        foreach ($tickets as $ticket) {
            if ($ticket->customer) {
                $user = \App\Models\User::where('email', $ticket->customer->email)->first();
                if ($user) {
                    $ticket->user_id = $user->id;
                    $ticket->save();
                    $updated++;
                    $this->info("Ticket #{$ticket->id} actualizado con user_id: {$user->id} ({$user->name})");
                }
            }
        }

        $this->info("Total de tickets actualizados: {$updated}");
        return 0;
    }
}
