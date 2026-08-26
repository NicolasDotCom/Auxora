import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter, Calendar, FileText } from 'lucide-react';
import { Ticket } from '@/types';

interface TicketExportSelectorProps {
    tickets: Ticket[];
}

export default function TicketExportSelector({ tickets }: TicketExportSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(tickets);

    // Filtrar tickets basado en búsqueda y filtros
    useEffect(() => {
        let filtered = tickets;

        // Filtro por término de búsqueda - busca en TODOS los campos relevantes
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(ticket => {
                // Búsqueda por ID (con y sin formato)
                const ticketId = ticket.id.toString();
                const formattedId = `#${ticketId.padStart(4, '0')}`;
                if (ticketId.includes(search) || formattedId.toLowerCase().includes(search)) {
                    return true;
                }

                // Búsqueda en campos de texto del ticket
                if (ticket.description?.toLowerCase().includes(search) ||
                    ticket.phone?.toLowerCase().includes(search) ||
                    ticket.address?.toLowerCase().includes(search) ||
                    ticket.brand?.toLowerCase().includes(search) ||
                    ticket.model?.toLowerCase().includes(search) ||
                    ticket.serial?.toLowerCase().includes(search)) {
                    return true;
                }

                // Búsqueda en relaciones (customer y support)
                if (ticket.customer?.name?.toLowerCase().includes(search) ||
                    ticket.customer?.email?.toLowerCase().includes(search) ||
                    ticket.customer?.name_user?.toLowerCase().includes(search)) {
                    return true;
                }

                if (ticket.support?.name?.toLowerCase().includes(search) ||
                    ticket.support?.email?.toLowerCase().includes(search)) {
                    return true;
                }

                // Búsqueda por estado (traducido)
                const statusText = getStatusLabel(ticket.status).toLowerCase();
                if (statusText.includes(search)) {
                    return true;
                }

                return false;
            });
        }

        // Filtro por estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }

        // Filtro por rango de fechas - compara correctamente las fechas
        if (startDate || endDate) {
            filtered = filtered.filter(ticket => {
                // Obtener solo la parte de fecha (YYYY-MM-DD) del created_at
                // Si viene como "2025-11-24 10:30:00" o "2025-11-24T10:30:00.000000Z"
                let ticketDateString = '';
                if (ticket.created_at) {
                    // Extraer solo la parte de fecha (primeros 10 caracteres YYYY-MM-DD)
                    ticketDateString = ticket.created_at.substring(0, 10);
                }

                // Verificar fecha desde
                if (startDate && ticketDateString < startDate) {
                    return false;
                }

                // Verificar fecha hasta
                if (endDate && ticketDateString > endDate) {
                    return false;
                }

                return true;
            });
        }

        setFilteredTickets(filtered);
    }, [tickets, searchTerm, statusFilter, startDate, endDate]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTickets(filteredTickets.map(ticket => ticket.id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleSelectTicket = (ticketId: number, checked: boolean) => {
        if (checked) {
            setSelectedTickets(prev => [...prev, ticketId]);
        } else {
            setSelectedTickets(prev => prev.filter(id => id !== ticketId));
        }
    };

    const handleExport = () => {
        if (selectedTickets.length === 0) {
            alert('Por favor selecciona al menos un ticket para exportar.');
            return;
        }

        // Crear un link temporal para la descarga
        const url = new URL(route('dashboard.export-tickets'), window.location.origin);
        url.searchParams.append('ticket_ids', selectedTickets.join(','));
        
        // Crear elemento link temporal
        const link = document.createElement('a');
        link.href = url.toString();
        link.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
        link.style.display = 'none';
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsOpen(false);
    };

    const handleExportPdf = () => {
        if (selectedTickets.length === 0) {
            alert('Por favor selecciona al menos un ticket para exportar.');
            return;
        }

        // Crear un link temporal para la descarga PDF
        const url = new URL(route('dashboard.export-tickets-pdf'), window.location.origin);
        url.searchParams.append('ticket_ids', selectedTickets.join(','));
        
        // Crear elemento link temporal
        const link = document.createElement('a');
        link.href = url.toString();
        link.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.style.display = 'none';
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsOpen(false);
    };

    const getStatusBadgeVariant = (status: string) => {
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

    const clearDateFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-4">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Filter className="w-4 h-4 mr-2" />
                        Seleccionar Tickets
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] sm:h-[85vh] flex flex-col w-[95vw]">
                    <DialogHeader className="pb-3 shrink-0">
                        <DialogTitle className="text-lg sm:text-xl">Seleccionar Tickets para Exportar</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Selecciona los tickets que deseas exportar a CSV. Puedes usar los filtros para encontrar tickets específicos.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 py-3 border-b shrink-0">
                        <div className="lg:col-span-1">
                            <Label htmlFor="search" className="text-xs font-medium">Buscar</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Buscar tickets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <Label htmlFor="status" className="text-xs font-medium">Estado</Label>
                            <select
                                id="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="Open">Abierto</option>
                                <option value="In Progress">En Progreso</option>
                                <option value="Closed">Cerrado</option>
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <Label htmlFor="start-date" className="text-xs font-medium">Fecha Desde</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 mt-1 w-full"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <Label htmlFor="end-date" className="text-xs font-medium">Fecha Hasta</Label>
                            <div className="flex gap-1 mt-1">
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 flex-1 w-full"
                                />
                                {(startDate || endDate) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={clearDateFilters}
                                        className="h-9 px-3 shrink-0"
                                        title="Limpiar filtros de fecha"
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seleccionar todos */}
                    <div className="flex items-center justify-between py-2 border-b bg-muted/20 shrink-0">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="font-medium text-sm">
                                Seleccionar todos ({filteredTickets.length} tickets)
                            </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {selectedTickets.length} seleccionados
                        </span>
                    </div>

                    {/* Lista de tickets - Con altura fija y scroll mejorado */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-y-auto border rounded-md bg-background">
                            <div className="p-2">
                                <div className="space-y-2">
                                    {filteredTickets.map((ticket) => (
                                        <div key={ticket.id} className="flex items-start space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={`ticket-${ticket.id}`}
                                                checked={selectedTickets.includes(ticket.id)}
                                                onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Label htmlFor={`ticket-${ticket.id}`} className="font-medium cursor-pointer text-sm">
                                                            #{ticket.id.toString().padStart(4, '0')}
                                                        </Label>
                                                        <Badge variant={getStatusBadgeVariant(ticket.status)} className="text-xs">
                                                            {getStatusLabel(ticket.status)}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {ticket.created_at ? ticket.created_at.substring(0, 10).split('-').reverse().join('/') : 'Sin fecha'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                                    {ticket.description || 'Sin descripción'}
                                                </p>
                                                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                                                    <span className="truncate">Cliente: {ticket.customer?.name || 'N/A'}</span>
                                                    <span className="truncate">Técnico: {ticket.support?.name || 'Sin asignar'}</span>
                                                    <span className="truncate">Equipo: {ticket.brand} {ticket.model}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTickets.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No se encontraron tickets con los filtros aplicados.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-3 border-t shrink-0 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="h-9 w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button onClick={handleExportPdf} disabled={selectedTickets.length === 0} variant="outline" className="h-9 w-full sm:w-auto">
                            <FileText className="w-4 h-4 mr-2" />
                            Exportar PDF ({selectedTickets.length})
                        </Button>
                        <Button onClick={handleExport} disabled={selectedTickets.length === 0} className="h-9 w-full sm:w-auto">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Excel ({selectedTickets.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
