import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    CheckCircle, 
    Clock, 
    XCircle, 
    Package,
    Calendar,
    User,
    Monitor,
    MapPin,
    Filter,
    Hash
} from 'lucide-react';

interface PendingPart {
    id: number;
    ticket_id: number;
    part_name: string;
    part_code: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    completed_at: string | null;
    user: {
        name: string;
    };
    completed_by_user: {
        name: string;
    } | null;
    ticket: {
        brand: string;
        model: string;
        serial: string;
        address: string;
        customer: {
            name: string;
        };
    };
}

interface Customer {
    id: number;
    name: string;
}

interface Props {
    pendingParts: PendingPart[];
    customers: Customer[];
}

const statusConfig = {
    pending: {
        label: 'Pendiente',
        icon: Clock,
        variant: 'warning' as const,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
    },
    completed: {
        label: 'Completado',
        icon: CheckCircle,
        variant: 'success' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    },
    cancelled: {
        label: 'Cancelado',
        icon: XCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
    }
};

export default function Index({ pendingParts, customers }: Props) {
    const page = usePage();
    const [partsState, setPartsState] = useState<PendingPart[]>(pendingParts);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTicket, setSearchTicket] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchCliente, setSearchCliente] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;
    const [confirmPartId, setConfirmPartId] = useState<number | null>(null);
    const [isUpdatingParts, setIsUpdatingParts] = useState(false);
    const [isClosingAllPending, setIsClosingAllPending] = useState(false);

    useEffect(() => {
        setPartsState(pendingParts);
    }, [pendingParts]);

    const handleStatusUpdate = (id: number, newStatus: 'completed' | 'cancelled') => {
        setIsUpdatingParts(true);

        router.patch(route('pending-parts.update-status', id), {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUpdatingParts(false);
            },
            onError: () => {
                setIsUpdatingParts(false);
                toast.error('No se pudo actualizar el repuesto.');
            },
        });
    };


    const resetPage = () => setCurrentPage(1);

    // Resetear página al cambiar filtros
    useEffect(() => { setCurrentPage(1); }, [searchTicket, searchSerial, searchCliente, statusFilter]);

    const handleClearFilters = () => {
        setSearchTicket('');
        setSearchSerial('');
        setSearchCliente('');
        setStatusFilter('all');
        resetPage();
    };

    const handleCloseAllPending = () => {
        if (!confirm('¿Seguro que deseas cerrar todos los repuestos pendientes abiertos?')) {
            return;
        }

        setIsClosingAllPending(true);

        router.patch(route('pending-parts.close-all-open'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsClosingAllPending(false);
                toast.success('Todos los repuestos pendientes fueron completados.');
            },
            onError: () => {
                setIsClosingAllPending(false);
                toast.error('No se pudieron cerrar todos los repuestos pendientes.');
            },
        });
    };

    const handleCardClick = (ticketId: number) => {
        setSelectedTicketId(ticketId);
        setIsModalOpen(true);
    };

    const getPartsForTicket = (ticketId: number) => {
        return partsState.filter(part => part.ticket_id === ticketId);
    };

    // Agrupar repuestos por ticket - mostrar solo uno por ticket
    const groupedParts = partsState.reduce((acc, part) => {
        if (!acc.find(p => p.ticket_id === part.ticket_id)) {
            acc.push(part);
        }
        return acc;
    }, [] as PendingPart[]);

    // Filtrar por búsqueda independiente
    const filteredParts = groupedParts.filter(part => {
        const matchTicket = !searchTicket.trim() || part.ticket_id.toString().includes(searchTicket);
        const matchSerial = !searchSerial.trim() || part.ticket.serial.toLowerCase().includes(searchSerial.toLowerCase());
        const matchCliente = !searchCliente.trim() || part.ticket.customer.name.toLowerCase().includes(searchCliente.toLowerCase());
        
        // Filtro por estado: verificar los repuestos del ticket
        let matchStatus = true;
        if (statusFilter !== 'all') {
            const ticketParts = partsState.filter(p => p.ticket_id === part.ticket_id);
            if (statusFilter === 'pending') {
                // Mostrar tickets que tengan al menos un repuesto pendiente
                matchStatus = ticketParts.some(p => p.status === 'pending');
            } else if (statusFilter === 'completed') {
                // Mostrar tickets donde TODOS los repuestos estén completados
                matchStatus = ticketParts.every(p => p.status === 'completed') && ticketParts.length > 0;
            }
        }
        
        return matchTicket && matchSerial && matchCliente && matchStatus;
    });

    const totalPages = Math.ceil(filteredParts.length / PAGE_SIZE);
    const pagedParts = filteredParts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const selectedTicketParts = selectedTicketId ? getPartsForTicket(selectedTicketId) : [];
    const selectedTicket = selectedTicketParts[0]?.ticket;
    const selectedPendingCount = selectedTicketParts.filter((part) => part.status === 'pending').length;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Agrupar repuestos por ticket para contar correctamente
    const ticketIds = [...new Set(partsState.map(p => p.ticket_id))];
    
    // Contar tickets con al menos un repuesto pendiente
    const ticketsWithPending = ticketIds.filter(ticketId => {
        const ticketParts = partsState.filter(p => p.ticket_id === ticketId);
        return ticketParts.some(p => p.status === 'pending');
    }).length;
    
    // Contar tickets con TODOS los repuestos completados (ninguno pendiente ni cancelado)
    const ticketsCompleted = ticketIds.filter(ticketId => {
        const ticketParts = partsState.filter(p => p.ticket_id === ticketId);
        return ticketParts.every(p => p.status === 'completed') && ticketParts.length > 0;
    }).length;
    
    const pendingCount = ticketsWithPending;
    const completedCount = ticketsCompleted;
    const pendingPartsCount = (page.props.pendingPartsCount as number | undefined) ?? 0;

    return (
        <AppLayout>
            <Head title="Repuestos Pendientes" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden rounded-xl p-3 sm:p-4 md:p-6">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0" />
                            <span className="truncate">Repuestos Pendientes</span>
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Administra los repuestos solicitados para los tickets de servicio
                        </p>
                    </div>

                    {/* Filtros de búsqueda */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 sm:p-4 rounded-xl border border-border bg-muted/40">
                        <div className="col-span-full flex flex-wrap items-center gap-2 pb-2 border-b border-border/60">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                                className="ml-auto h-7 text-xs border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                            >
                                Limpiar Filtros
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCloseAllPending}
                                disabled={isClosingAllPending || pendingPartsCount === 0}
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                            >
                                {isClosingAllPending ? 'Cerrando...' : `Cerrar todos (${pendingPartsCount})`}
                            </Button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Número de Ticket</label>
                            <div className="relative">
                                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Ej: 123"
                                    value={searchTicket}
                                    onChange={(e) => setSearchTicket(e.target.value)}
                                    className="h-9 pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial</label>
                            <div className="relative">
                                <Monitor className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Ej: ABC123"
                                    value={searchSerial}
                                    onChange={(e) => setSearchSerial(e.target.value)}
                                    className="h-9 pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                            <Select value={searchCliente || 'all'} onValueChange={(v) => setSearchCliente(v === 'all' ? '' : v)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos los clientes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los clientes</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.name}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="pending">Pendientes</SelectItem>
                                    <SelectItem value="completed">Completados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Total Pendientes</p>
                                        <p className="text-xl sm:text-2xl font-bold text-orange-500 truncate">{pendingCount}</p>
                                    </div>
                                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Completados</p>
                                        <p className="text-xl sm:text-2xl font-bold text-green-500 truncate">{completedCount}</p>
                                    </div>
                                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="sm:col-span-2 lg:col-span-1">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Total Solicitudes</p>
                                        <p className="text-xl sm:text-2xl font-bold text-blue-500 truncate">{ticketIds.length}</p>
                                    </div>
                                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Parts List */}
                    {partsState.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 sm:p-12 text-center">
                                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No hay repuestos registrados</h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Los repuestos solicitados desde los tickets aparecerán aquí
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            {pagedParts.map((part) => {
                                const config = statusConfig[part.status];
                                const StatusIcon = config.icon;
                                const partsCount = getPartsForTicket(part.ticket_id).length;
                                
                                return (
                                    <Card 
                                        key={part.id} 
                                        className={`${config.borderColor} border-l-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]`}
                                        onClick={() => handleCardClick(part.ticket_id)}
                                    >
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex flex-col gap-3">
                                                {/* Part Information */}
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 min-w-0 flex-1">
                                                        <div className={`p-1.5 rounded-lg shrink-0 ${config.bgColor}`}>
                                                            <Package className={`h-4 w-4 ${config.color}`} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                Ticket #{part.ticket_id}
                                                            </p>
                                                            <h3 className="font-semibold text-foreground text-sm truncate">
                                                                {part.part_name}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground font-mono truncate">
                                                                Código: {part.part_code}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                <StatusIcon className={`h-3.5 w-3.5 ${config.color} shrink-0`} />
                                                                <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                                                                    {config.label}
                                                                </Badge>
                                                                {partsCount > 1 && (
                                                                    <Badge variant="default" className="bg-blue-600 text-[10px] px-1.5 py-0">
                                                                        +{partsCount - 1} más
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Botón Completar */}
                                                    {part.status === 'pending' && (
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); setConfirmPartId(part.id); }}
                                                            className="shrink-0 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                                            size="sm"
                                                        >
                                                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                            Completar
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Equipment Information */}
                                                <div className="border-t border-border pt-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-2 gap-y-1 text-xs">
                                                        <div className="flex items-center gap-1.5 col-span-1 sm:col-span-3">
                                                            <span className="text-muted-foreground shrink-0">Cliente:</span>
                                                            <span className="font-medium text-foreground truncate">{part.ticket.customer.name}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-muted-foreground block">Marca:</span>
                                                            <span className="font-medium truncate block">{part.ticket.brand}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-muted-foreground block">Modelo:</span>
                                                            <span className="font-medium truncate block">{part.ticket.model}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-muted-foreground block">Serial:</span>
                                                            <span className="font-medium truncate block">{part.ticket.serial}</span>
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground shrink-0">Solicitado por:</span>
                                                            <span className="font-medium truncate">{part.user.name}</span>
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground shrink-0">Dirección:</span>
                                                            <span className="font-medium truncate">{part.ticket.address}</span>
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground shrink-0">Fecha:</span>
                                                            <span className="font-medium">{formatDate(part.created_at)}</span>
                                                        </div>
                                                        {part.status === 'completed' && part.completed_by_user && (
                                                            <>
                                                                <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 pt-1 border-t border-border mt-1">
                                                                    <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                                    <span className="text-muted-foreground shrink-0">Completado por:</span>
                                                                    <span className="font-medium text-green-600 truncate">{part.completed_by_user.name}</span>
                                                                </div>
                                                                {part.completed_at && (
                                                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                                                                        <Calendar className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                                        <span className="text-muted-foreground shrink-0">Fecha completado:</span>
                                                                        <span className="font-medium text-green-600">{formatDate(part.completed_at)}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                                    <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                                        Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filteredParts.length)} de {filteredParts.length} elementos
                                    </p>
                                    <Pagination className="order-1 sm:order-2 w-auto">
                                        <PaginationContent className="gap-0.5">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                                                    acc.push(p);
                                                    return acc;
                                                }, [])
                                                .map((item, idx) =>
                                                    item === 'ellipsis' ? (
                                                        <PaginationItem key={`e-${idx}`}>
                                                            <span className="flex h-9 w-8 items-center justify-center text-sm text-muted-foreground">…</span>
                                                        </PaginationItem>
                                                    ) : (
                                                        <PaginationItem key={item}>
                                                            <PaginationLink
                                                                isActive={currentPage === item}
                                                                onClick={() => setCurrentPage(item as number)}
                                                                className="cursor-pointer"
                                                            >
                                                                {item}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )
                                                )
                                            }
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Modal de detalles */}
                    <Dialog
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) {
                                setSelectedTicketId(null);
                            }
                        }}
                    >
                        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                            <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                                    <Package className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                                    <span className="truncate">Repuestos para esta Máquina</span>
                                </DialogTitle>
                                {selectedTicket && (
                                    <DialogDescription className="text-sm sm:text-base mt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                            <div className="min-w-0">
                                                <span className="text-gray-600 font-medium text-xs sm:text-sm">Cliente:</span>
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedTicket.customer.name}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-gray-600 font-medium text-xs sm:text-sm">Marca:</span>
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedTicket.brand}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-gray-600 font-medium text-xs sm:text-sm">Modelo:</span>
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedTicket.model}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-gray-600 font-medium text-xs sm:text-sm">Serial:</span>
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedTicket.serial}</p>
                                            </div>
                                        </div>
                                    </DialogDescription>
                                )}
                            </DialogHeader>

                            <div className="mt-4 sm:mt-6 space-y-3">
                                <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="font-semibold text-base sm:text-lg">
                                        Total de repuestos: {selectedTicketParts.length}
                                    </h3>
                                </div>
                                {selectedTicketParts.map((part, index) => {
                                    const config = statusConfig[part.status];
                                    const StatusIcon = config.icon;
                                    return (
                                        <div 
                                            key={part.id}
                                            className={`p-3 sm:p-4 border-l-4 ${config.borderColor} bg-white rounded-lg border border-gray-200 shadow-sm`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                                                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                    <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
                                                        <Package className={`h-5 w-5 ${config.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-900">#{index + 1}</span>
                                                            <h4 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                                                {part.part_name}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 font-mono mb-2 truncate">
                                                            Código: {part.part_code}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <StatusIcon className={`h-4 w-4 ${config.color}`} />
                                                                <Badge variant={config.variant}>
                                                                    {config.label}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-gray-600 min-w-0">
                                                                <User className="h-4 w-4 shrink-0" />
                                                                <span className="truncate">{part.user.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <Calendar className="h-4 w-4 shrink-0" />
                                                                <span>{formatDate(part.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        {part.status === 'completed' && part.completed_by_user && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                                                    <div className="flex items-center gap-1 text-green-600 min-w-0">
                                                                        <CheckCircle className="h-4 w-4 shrink-0" />
                                                                        <span className="font-medium truncate">Completado por: {part.completed_by_user.name}</span>
                                                                    </div>
                                                                    {part.completed_at && (
                                                                        <div className="flex items-center gap-1 text-green-600">
                                                                            <Calendar className="h-4 w-4 shrink-0" />
                                                                            <span>{formatDate(part.completed_at)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {part.status === 'pending' && (
                                                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                                                        <Button
                                                            onClick={() => setConfirmPartId(part.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                                            size="sm"
                                                            disabled={isUpdatingParts}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Completar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </DialogContent>
                    </Dialog>
            </div>

            {/* Diálogo de confirmación */}
            <AlertDialog open={confirmPartId !== null} onOpenChange={(open) => { if (!open) setConfirmPartId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Confirmar finalización
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas marcar este repuesto como <strong>completado</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isUpdatingParts}
                            onClick={() => {
                                if (confirmPartId !== null) {
                                    handleStatusUpdate(confirmPartId, 'completed');
                                    setConfirmPartId(null);
                                }
                            }}
                        >
                            Sí, completar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    );
}
