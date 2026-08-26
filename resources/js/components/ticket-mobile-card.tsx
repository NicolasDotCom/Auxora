import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/types';
import { Eye, Pencil, FileText, Copy } from 'lucide-react';
import { Link } from '@inertiajs/react';
import React from 'react';

interface TicketMobileCardProps {
    ticket: Ticket;
    onViewDetails: (ticket: Ticket) => void;
    canEdit?: boolean;
    canDuplicate?: boolean;
}

const getStatusVariant = (status: string): 'open' | 'progress' | 'closed' | 'outline' => {
    switch (status) {
        case 'Open':
            return 'open';
        case 'In Progress':
            return 'progress';
        case 'Closed':
            return 'closed';
        default:
            return 'outline';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'Open':
            return 'Abierto';
        case 'In Progress':
            return 'En Progreso';
        case 'Closed':
            return 'Cerrado';
        default:
            return status;
    }
};

const getStatusBorderColor = (status: string): React.CSSProperties => {
    switch (status) {
        case 'Open':        return { borderLeftColor: 'rgb(239 68 68)' };   // red-500
        case 'In Progress': return { borderLeftColor: 'rgb(251 146 60)' };  // orange-400
        case 'Closed':      return { borderLeftColor: 'rgb(34 197 94)' };   // green-500
        default:            return { borderLeftColor: 'rgb(156 163 175)' }; // gray-400
    }
};

export function TicketMobileCard({ ticket, onViewDetails, canEdit = false, canDuplicate = false }: TicketMobileCardProps) {
    return (
        <div 
            className="border border-gray-200 dark:border-gray-200 border-l-4 rounded-lg p-4 bg-white dark:bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3"
            style={getStatusBorderColor(ticket.status)}
            onClick={() => onViewDetails(ticket)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xl text-gray-900 dark:text-gray-900">
                        #{ticket.id.toString().padStart(4, '0')}
                    </span>
                    <Badge variant={getStatusVariant(ticket.status)} className="text-xs px-2.5 py-0.5">
                        {getStatusLabel(ticket.status)}
                    </Badge>
                </div>
                {ticket.documents_count !== undefined && ticket.documents_count > 0 && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-100 text-gray-700 dark:text-gray-700 px-2 py-1 rounded-md">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{ticket.documents_count}</span>
                    </div>
                )}
            </div>

            <div className="space-y-2.5">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                        {ticket.cliente_externo ? 'Cliente Externo' : 'Cliente'}
                    </span>
                    <span className="text-gray-900 dark:text-gray-900 text-sm font-medium">
                        {ticket.cliente_externo || ticket.customer?.name || 'Sin asignar'}
                    </span>
                </div>
                
                {ticket.brand && ticket.model && (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Equipo</span>
                        <span className="text-gray-900 dark:text-gray-900 text-sm">{ticket.brand} {ticket.model}</span>
                    </div>
                )}

                {ticket.description && (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Descripción</span>
                        <p className="text-gray-700 dark:text-gray-700 line-clamp-3 text-xs leading-relaxed" title={ticket.description}>
                            {ticket.description}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                    <Link href={route('tickets.show', ticket.id)}>
                        <Button size="sm" variant="outline" className="h-8 px-2.5">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    {canDuplicate && (
                        <Link href={route('tickets.duplicate', ticket.id)}>
                            <Button size="sm" variant="outline" className="h-8 px-2.5" title="Duplicar ticket">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    )}
                    {canEdit && (
                        <Link href={route('tickets.edit', ticket.id)}>
                            <Button size="sm" variant="default" className="h-8 px-2.5">
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    )}
                </div>
                {ticket.created_at && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {new Date(ticket.created_at).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: '2-digit'
                        })}
                    </span>
                )}
            </div>
        </div>
    );
}
