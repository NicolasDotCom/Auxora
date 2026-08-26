<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Ticket;
use App\Models\TicketHistory;

class TicketHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear historial de creación para todos los tickets existentes que no lo tengan
        $tickets = Ticket::whereNotExists(function ($query) {
            $query->select('id')
                ->from('ticket_histories')
                ->whereColumn('ticket_histories.ticket_id', 'tickets.id')
                ->where('ticket_histories.action', 'created');
        })->get();

        foreach ($tickets as $ticket) {
            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $ticket->user_id,
                'action' => 'created',
                'field' => null,
                'old_value' => null,
                'new_value' => $ticket->status,
                'description' => 'Ticket creado',
                'created_at' => $ticket->created_at,
                'updated_at' => $ticket->created_at,
            ]);

            // Si el ticket está asignado a un técnico, crear registro de asignación
            if ($ticket->support_id) {
                TicketHistory::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $ticket->user_id,
                    'action' => 'assigned',
                    'field' => 'support_id',
                    'old_value' => 'Sin asignar',
                    'new_value' => $ticket->support->name,
                    'description' => "Técnico asignado: {$ticket->support->name}",
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->created_at,
                ]);
            }

            // Si el ticket está cerrado, crear registro de cierre
            if ($ticket->status === 'Closed' && $ticket->closed_at) {
                TicketHistory::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $ticket->user_id,
                    'action' => 'status_changed',
                    'field' => 'status',
                    'old_value' => 'Open',
                    'new_value' => 'Closed',
                    'description' => 'Estado cambiado de Open a Closed',
                    'created_at' => $ticket->closed_at,
                    'updated_at' => $ticket->closed_at,
                ]);
            }
        }

        $this->command->info('Historial creado para ' . $tickets->count() . ' tickets.');
    }
}
