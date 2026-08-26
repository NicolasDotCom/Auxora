import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ticket } from '@/types';
import { Eye, Pencil, FileText } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface TicketDetailModalProps {
    ticket: Ticket | null;
    isOpen: boolean;
    onClose: () => void;
    canEdit?: boolean;
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

export function TicketDetailModal({ ticket, isOpen, onClose, canEdit = false }: TicketDetailModalProps) {
    if (!ticket) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Ticket #{ticket.id.toString().padStart(4, '0')}
                        <Badge variant={getStatusVariant(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Información completa del ticket
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Cliente</label>
                            <p className="text-sm mt-1">{ticket.customer?.name || 'Sin asignar'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Soporte Técnico</label>
                            <p className="text-sm mt-1">{ticket.support?.name || 'Sin asignar'}</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="text-sm mt-1">{ticket.description || 'Sin descripción'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Marca</label>
                            <p className="text-sm mt-1">{ticket.brand || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Modelo</label>
                            <p className="text-sm mt-1">{ticket.model || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Serial</label>
                            <p className="text-sm mt-1">{ticket.serial || 'N/A'}</p>
                        </div>
                    </div>

                    {ticket.phone && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Teléfono</label>
                            <p className="text-sm mt-1">{ticket.phone}</p>
                        </div>
                    )}

                    {ticket.address && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Dirección</label>
                            <p className="text-sm mt-1">{ticket.address}</p>
                        </div>
                    )}

                    {ticket.documents_count !== undefined && ticket.documents_count > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>{ticket.documents_count} documento(s) adjunto(s)</span>
                        </div>
                    )}

                    {ticket.created_at && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                            <p className="text-sm mt-1">{new Date(ticket.created_at).toLocaleDateString('es-ES')}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cerrar
                    </Button>
                    <Link href={route('tickets.show', ticket.id)} className="w-full sm:w-auto">
                        <Button variant="default" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                        </Button>
                    </Link>
                    {canEdit && (
                        <Link href={route('tickets.edit', ticket.id)} className="w-full sm:w-auto">
                            <Button variant="default" className="w-full">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
