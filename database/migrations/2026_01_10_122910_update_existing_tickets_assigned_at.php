<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Ticket;
use App\Models\TicketHistory;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar tickets existentes que tienen técnico asignado
        // pero no tienen assigned_at
        
        $tickets = Ticket::whereNotNull('support_id')
            ->whereNull('assigned_at')
            ->get();
        
        foreach ($tickets as $ticket) {
            // Intentar obtener la fecha de asignación del historial
            $assignmentHistory = TicketHistory::where('ticket_id', $ticket->id)
                ->where('action', 'assigned')
                ->where('field', 'support_id')
                ->orderBy('created_at', 'asc')
                ->first();
            
            if ($assignmentHistory) {
                // Si existe historial de asignación, usar esa fecha
                $ticket->assigned_at = $assignmentHistory->created_at;
            } else {
                // Si no hay historial, usar la fecha de creación del ticket
                // (asumiendo que fue asignado al crear)
                $ticket->assigned_at = $ticket->created_at;
            }
            
            $ticket->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No es necesario hacer nada en el rollback
        // ya que solo estamos actualizando datos existentes
    }
};

