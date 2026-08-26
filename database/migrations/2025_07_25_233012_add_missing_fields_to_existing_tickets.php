<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Ticket;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar tickets existentes con valores por defecto
        $tickets = Ticket::whereNull('phone')
            ->orWhereNull('address')
            ->orWhereNull('brand')
            ->orWhereNull('model')
            ->orWhereNull('serial')
            ->get();

        foreach ($tickets as $ticket) {
            $ticket->update([
                'phone' => $ticket->phone ?? 'No especificado',
                'address' => $ticket->address ?? 'No especificado',
                'brand' => $ticket->brand ?? 'No especificado',
                'model' => $ticket->model ?? 'No especificado',
                'serial' => $ticket->serial ?? 'No especificado',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No necesario para esta migración de datos
    }
};
