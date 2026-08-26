<?php

namespace App\Exports;

use App\Models\Ticket;
use Illuminate\Support\Collection;
use Barryvdh\DomPDF\Facade\Pdf;

class TicketsExport
{
    protected $ticketIds;

    public function __construct(array $ticketIds = [])
    {
        $this->ticketIds = $ticketIds;
    }

    /**
     * Generar CSV simple para exportación
     */
    public function toCsv()
    {
        $query = Ticket::with(['customer', 'support']);
        
        if (!empty($this->ticketIds)) {
            $query->whereIn('id', $this->ticketIds);
        }
        
        $tickets = $query->get();
        
        // Usar output buffering para capturar el CSV
        ob_start();
        $output = fopen('php://output', 'w');
        
        // Agregar BOM para UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Encabezados
        fputcsv($output, [
            'Número de Ticket',
            'Asunto',
            'Cliente',
            'Nombre de Contacto',
            'Dirección',
            'Técnico Asignado',
            'Estado',
            'Fecha de Creación',
            'Marca',
            'Modelo',
            'Número de Serie',
            'Fecha de Cierre'
        ]);
        
        // Datos
        foreach ($tickets as $ticket) {
            fputcsv($output, [
                '#' . str_pad($ticket->id, 4, '0', STR_PAD_LEFT),
                $ticket->subject ?? 'Sin asunto',
                $ticket->customer ? $ticket->customer->name : 'Sin asignar',
                $ticket->nombre_contacto ?? 'N/A',
                $ticket->address ?? 'N/A',
                $ticket->support ? $ticket->support->name : 'Sin asignar',
                match($ticket->status) {
                    'Open' => 'Abierto',
                    'In Progress' => 'En Progreso',
                    'Closed' => 'Cerrado',
                    default => $ticket->status
                },
                $ticket->created_at ? $ticket->created_at->setTimezone(config('app.timezone'))->format('d/m/Y H:i') : '',
                $ticket->brand ?? 'N/A',
                $ticket->model ?? 'N/A',
                $ticket->serial ?? 'N/A',
                $ticket->closed_at ? $ticket->closed_at->setTimezone(config('app.timezone'))->format('d/m/Y H:i') : 'No cerrado'
            ]);
        }
        
        fclose($output);
        $csvContent = ob_get_clean();
        
        return $csvContent;
    }

    /**
     * Generar PDF para exportación
     */
    public function toPdf()
    {
        $query = Ticket::with(['customer', 'support']);
        
        if (!empty($this->ticketIds)) {
            $query->whereIn('id', $this->ticketIds);
        }
        
        $tickets = $query->get()->map(function($ticket) {
            return [
                'numero' => '#' . str_pad($ticket->id, 4, '0', STR_PAD_LEFT),
                'asunto' => $ticket->subject ?? 'Sin asunto',
                'cliente' => $ticket->customer ? $ticket->customer->name : 'Sin asignar',
                'nombre_contacto' => $ticket->nombre_contacto ?? 'N/A',
                'direccion' => $ticket->address ?? 'N/A',
                'tecnico' => $ticket->support ? $ticket->support->name : 'Sin asignar',
                'estado' => match($ticket->status) {
                    'Open' => 'Abierto',
                    'In Progress' => 'En Progreso',
                    'Closed' => 'Cerrado',
                    default => $ticket->status
                },
                'fecha_creacion' => $ticket->created_at ? $ticket->created_at->setTimezone(config('app.timezone'))->format('d/m/Y H:i') : '',
                'marca' => $ticket->brand ?? 'N/A',
                'modelo' => $ticket->model ?? 'N/A',
                'serial' => $ticket->serial ?? 'N/A',
                'fecha_cierre' => $ticket->closed_at ? $ticket->closed_at->setTimezone(config('app.timezone'))->format('d/m/Y H:i') : 'No cerrado'
            ];
        });

        $pdf = Pdf::loadView('exports.tickets-pdf', ['tickets' => $tickets]);
        $pdf->setPaper('a4', 'landscape');
        
        return $pdf;
    }
}