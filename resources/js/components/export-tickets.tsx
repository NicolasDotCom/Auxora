import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Ticket {
    id: number;
    numero_ticket: string;
    subject: string;
    customer_name: string;
    company: string;
    support_name: string;
    status: string;
    created_at: string;
    brand: string;
    model: string;
    serial: string;
}

interface ExportTicketsProps {
    tickets: Ticket[];
}

export default function ExportTickets({ tickets }: ExportTicketsProps) {
    const { isAdmin } = useAuth();
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        ticket_ids: [] as number[]
    });

    // Solo mostrar para administradores
    if (!isAdmin()) {
        return null;
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTickets(tickets.map(ticket => ticket.id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleTicketSelect = (ticketId: number, checked: boolean) => {
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

        setData('ticket_ids', selectedTickets);
        
        post(route('dashboard.export-tickets'), {
            onSuccess: () => {
                setIsOpen(false);
                setSelectedTickets([]);
            },
            onError: (errors: any) => {
                console.error('Error al exportar:', errors);
            }
        });
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
        setSelectedTickets([]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Exportar Tickets
                </CardTitle>
                <CardDescription>
                    Selecciona los tickets que deseas exportar a Excel
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar a Excel
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>Seleccionar Tickets para Exportar</DialogTitle>
                            <DialogDescription>
                                Selecciona los tickets que deseas incluir en el archivo Excel.
                                Total de tickets disponibles: {tickets.length}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 overflow-y-auto max-h-96">
                            <div className="flex items-center space-x-2 border-b pb-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedTickets.length === tickets.length && tickets.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium">
                                    Seleccionar todos ({tickets.length})
                                </label>
                            </div>
                            
                            <div className="space-y-2">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="flex items-start space-x-3 p-2 rounded border hover:bg-gray-50">
                                        <Checkbox
                                            id={`ticket-${ticket.id}`}
                                            checked={selectedTickets.includes(ticket.id)}
                                            onCheckedChange={(checked) => handleTicketSelect(ticket.id, checked as boolean)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{ticket.numero_ticket}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    ticket.status === 'Abierto' ? 'bg-red-600 text-white' :
                                                    ticket.status === 'En Progreso' ? 'bg-orange-500 text-white' :
                                                    ticket.status === 'Cerrado' ? 'bg-green-600 text-white' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-900 truncate">{ticket.subject}</p>
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span>{ticket.customer_name}</span> • 
                                                <span> {ticket.company}</span> • 
                                                <span> {ticket.support_name}</span> • 
                                                <span> {ticket.created_at}</span>
                                            </div>
                                            {(ticket.brand !== 'N/A' || ticket.model !== 'N/A' || ticket.serial !== 'N/A') && (
                                                <div className="text-xs text-gray-500">
                                                    {ticket.brand} {ticket.model} - S/N: {ticket.serial}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-gray-500">
                                    {selectedTickets.length} de {tickets.length} tickets seleccionados
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        onClick={handleExportPdf} 
                                        disabled={processing || selectedTickets.length === 0}
                                        variant="outline"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Exportar PDF
                                    </Button>
                                    <Button 
                                        onClick={handleExport} 
                                        disabled={processing || selectedTickets.length === 0}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar Excel
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
