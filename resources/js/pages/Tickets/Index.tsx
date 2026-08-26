import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { PageProps, Ticket, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Eye, SlidersHorizontal, ChevronDown, ChevronUp, UserCircle2, Hash, Filter, Tag, SearchX, Copy, CalendarDays } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

function DateFilterInput({
    value,
    onChange,
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className="relative">
            <Input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`h-9 pr-10 date-picker-contrast ${className}`.trim()}
            />
            <CalendarDays className="date-picker-icon pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </div>
    );
}
import { TicketMobileCard } from '@/components/ticket-mobile-card';
import { TicketDetailModal } from '@/components/ticket-detail-modal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tickets',
        href: '/tickets',
    },
];

interface TicketFilters {
    ticket_id?: string;
    company_name?: string;
    support_id?: string;
    subject?: string;
    serial?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    cliente_externo?: string;
}

export default function Index() {
    const { tickets, auth, allCustomers, allSupports, filters, isComercial: isComercialProp } = usePage<PageProps & { 
        allCustomers: any[];
        allSupports: any[];
        filters: TicketFilters;
        isComercial: boolean;
    }>().props;
    
    const isSupportRole = auth?.roles?.includes('support');
    const isCustomerRole = auth?.roles?.includes('customer');
    const isComercial = isComercialProp || auth?.roles?.includes('Comercial');
    const canDuplicate = auth?.permissions?.includes('create ticket');

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    // Estados de filtros - inicializar con valores del backend
    const [ticketIdFilter, setTicketIdFilter] = useState(filters?.ticket_id || '');
    const [clientFilter, setClientFilter] = useState(filters?.company_name || 'all');
    const [clienteExternoFilter, setClienteExternoFilter] = useState(filters?.cliente_externo || '');
    const [supportFilter, setSupportFilter] = useState(filters?.support_id || 'all');
    const [subjectFilter, setSubjectFilter] = useState(filters?.subject || 'all');
    const [serialFilter, setSerialFilter] = useState(filters?.serial || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [dateFromFilter, setDateFromFilter] = useState(filters?.date_from || '');
    const [dateToFilter, setDateToFilter] = useState(filters?.date_to || '');

    // Debounce para campos de texto libre (evita un request por cada tecla)
    const debouncedTicketId = useDebounce(ticketIdFilter, 300);
    const debouncedSerial = useDebounce(serialFilter, 300);
    const debouncedClienteExterno = useDebounce(clienteExternoFilter, 300);
    
    // Búsqueda para autocomplete
    const [clientSearchTerm, setClientSearchTerm] = useState(
        filters?.company_name && filters.company_name !== 'all' ? filters.company_name : ''
    );
    const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
    const [supportSearchTerm, setSupportSearchTerm] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Detectar cambios en filtros y actualizar backend
    // Los campos de texto usan versión debounced para no disparar por cada tecla
    useEffect(() => {
        const params: Record<string, string> = {};
        
        if (debouncedTicketId) params.ticket_id = debouncedTicketId;
        if (!isComercial && clientFilter !== 'all') params.company_name = clientFilter;
        if (isComercial && debouncedClienteExterno) params.cliente_externo = debouncedClienteExterno;
        if (supportFilter !== 'all') params.support_id = supportFilter;
        if (subjectFilter !== 'all') params.subject = subjectFilter;
        if (debouncedSerial) params.serial = debouncedSerial;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (dateFromFilter) params.date_from = dateFromFilter;
        if (dateToFilter) params.date_to = dateToFilter;

        // Solo hacer request si hay cambios
        const currentParams = new URLSearchParams(window.location.search);
        const newParamsString = new URLSearchParams(params).toString();
        const currentParamsString = currentParams.toString();

        if (newParamsString !== currentParamsString) {
            router.get(
                route('tickets.index'),
                params,
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['tickets'],
                    replace: true,
                }
            );
        }
    }, [debouncedTicketId, clientFilter, debouncedClienteExterno, supportFilter, subjectFilter, debouncedSerial, statusFilter, dateFromFilter, dateToFilter]);

    // Limpiar todos los filtros
    const clearAllFilters = () => {
        setTicketIdFilter('');
        setClientFilter('all');        setClienteExternoFilter('');        setSupportFilter('all');
        setSubjectFilter('all');
        setSerialFilter('');
        setStatusFilter('all');
        setDateFromFilter('');
        setDateToFilter('');
        setClientSearchTerm('');
        setSupportSearchTerm('');
        toast.info('Filtros limpiados');
        router.get(route('tickets.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['tickets'],
        });
    };

    // Listas filtradas para autocomplete
    const uniqueClients = clientSearchTerm
        ? (allCustomers as string[]).filter((name: string) =>
            name.toLowerCase().includes(clientSearchTerm.toLowerCase())
          )
        : [];
    
    const uniqueSupports = supportSearchTerm
        ? allSupports.filter((support: any) => 
            support.name.toLowerCase().includes(supportSearchTerm.toLowerCase())
          )
        : allSupports;
    
    const uniqueSubjects = [
        'Mantenimiento Preventivo',
        'Manchas',
        'Atascos',
        'Instalación',
        'Configuración ó Escaner',
        'Código de Error',
        'Remoto',
        'Servicio de Ingeniería',
        'Solicitud de Toner',
        'Contadores',
        'Otros'
    ];

    const getStatus = (status: Ticket['status']): 'open' | 'progress' | 'closed' | 'outline' => {
        switch (status) {
            case 'Open': return 'open';
            case 'In Progress': return 'progress';
            case 'Closed': return 'closed';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Open': return 'Abierto';
            case 'In Progress': return 'En Progreso';
            case 'Closed': return 'Cerrado';
            default: return status;
        }
    };

    const columns: ColumnDef<Ticket>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
        },
        {
            accessorKey: 'customer.id',
            header: isComercial ? 'Cliente Externo' : 'Cliente',
            cell: ({row}) => {
                const ticket = row.original;
                if (ticket.cliente_externo) {
                    return (
                        <span>
                            {ticket.cliente_externo}
                            {!isComercial && ticket.user?.name && (
                                <span className="block text-xs text-muted-foreground">{ticket.user.name}</span>
                            )}
                        </span>
                    );
                }
                return ticket.customer?.name || 'Sin asignar';
            }
        },
        {
            accessorKey: 'support.id',
            header: 'Soporte Técnico',
            cell: ({row}) => {
                const name = row.original.support?.name;
                return (
                    <span className="flex items-center gap-1.5">
                        <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className={name ? '' : 'text-muted-foreground italic'}>
                            {name || 'Sin asignar'}
                        </span>
                    </span>
                );
            }
        },
        {
            accessorKey: 'subject',
            header: 'Asunto',
            cell: ({row}) => {
                const subject = row.original.subject || '';
                const maxLength = 40;
                return (
                    <span className="line-clamp-1" title={subject}>
                        {subject.length > maxLength 
                            ? `${subject.substring(0, maxLength)}...` 
                            : subject}
                    </span>
                );
            }
        },
        {
            accessorKey: 'brand',
            header: 'Marca'
        },
        {
            accessorKey: 'model',
            header: 'Modelo'
        },
        {
            accessorKey: 'serial',
            header: 'Serial'
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({row}) => {
                const status = row.original.status;
                const isOpen = status === 'Open';
                return (
                    <Badge variant={getStatus(status)} className='capitalize flex items-center gap-1.5 w-fit'>
                        {isOpen && (
                            <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                        )}
                        {getStatusLabel(status)}
                    </Badge>
                );
            }
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const ticket = row.original;
                return (
                    <div className='flex gap-2'>
                        <Link href={route('tickets.show', ticket.id)} preserveState>
                            <Button size="sm" variant="outline">
                                <Eye className='h-4 w-4'/>
                            </Button>
                        </Link>
                        {canDuplicate && (
                            <Link href={route('tickets.duplicate', ticket.id)} preserveState>
                                <Button size="sm" variant="outline" title="Duplicar ticket">
                                    <Copy className='h-4 w-4'/>
                                </Button>
                            </Link>
                        )}
                        {(auth?.roles?.some(role => 
                            ['admin', 'Coordinador', 'customer', 'Comercial'].includes(role)
                        )) && (
                            <Link href={route('tickets.edit', ticket.id)} preserveState>
                                <Button size="sm" variant="default">
                                    <Pencil className='h-4 w-4'/>
                                </Button>
                            </Link>
                        )}
                    </div>
                );
            },
        },
    ];

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['tickets'],
            });
        }
    }, []);

    const handleViewDetails = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tickets</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Gestión y seguimiento de todos los tickets de soporte</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={clearAllFilters}
                            className="w-full sm:w-auto border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                            Limpiar Filtros
                        </Button>
                        <Link href={route('tickets.create')}>
                            <Button className="w-full sm:w-auto">
                                <Plus className='mr-2 h-4 w-4' /> Crear Ticket
                            </Button>
                        </Link>
                    </div>
                </div>

                <Separator />

                {/* Vista Desktop */}
                <div className="hidden md:block space-y-4">
                    {/* Filtros para soporte técnico */}
                    {isSupportRole && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                            <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300"># Ticket</label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="123"
                                        value={ticketIdFilter}
                                        onChange={(e) => setTicketIdFilter(e.target.value)}
                                        type="number"
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                                <Input
                                    placeholder="Buscar empresa..."
                                    value={clientSearchTerm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setClientSearchTerm(val);
                                        setClientDropdownOpen(true);
                                        if (!val) setClientFilter('all');
                                    }}
                                    onFocus={() => { if (clientSearchTerm) setClientDropdownOpen(true); }}
                                    onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                                    className="h-9"
                                />
                                {clientDropdownOpen && uniqueClients.length > 0 && (
                                    <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                                        {uniqueClients.map((name: string) => (
                                            <div
                                                key={name}
                                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setClientFilter(name);
                                                    setClientSearchTerm(name);
                                                    setClientDropdownOpen(false);
                                                }}
                                            >
                                                {name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial</label>
                                <div className="relative">
                                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="ABC123..."
                                        value={serialFilter}
                                        onChange={(e) => setSerialFilter(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="Open">Abierto</SelectItem>
                                        <SelectItem value="In Progress">En Progreso</SelectItem>
                                        <SelectItem value="Closed">Cerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
                                <DateFilterInput value={dateFromFilter} onChange={setDateFromFilter} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
                                <DateFilterInput value={dateToFilter} onChange={setDateToFilter} />
                            </div>
                        </div>
                    )}

                    {/* Filtros para clientes */}
                    {isCustomerRole && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                            <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300"># Ticket</label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="123"
                                        value={ticketIdFilter}
                                        onChange={(e) => setTicketIdFilter(e.target.value)}
                                        type="number"
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial</label>
                                <div className="relative">
                                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="ABC123..."
                                        value={serialFilter}
                                        onChange={(e) => setSerialFilter(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="Open">Abierto</SelectItem>
                                        <SelectItem value="In Progress">En Progreso</SelectItem>
                                        <SelectItem value="Closed">Cerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
                                <DateFilterInput value={dateFromFilter} onChange={setDateFromFilter} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
                                <DateFilterInput value={dateToFilter} onChange={setDateToFilter} />
                            </div>
                        </div>
                    )}

                    {/* Filtros completos para NO soporte y NO cliente */}
                    {!isSupportRole && !isCustomerRole && (
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                            <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    # Ticket
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="123"
                                        value={ticketIdFilter}
                                        onChange={(e) => setTicketIdFilter(e.target.value)}
                                        type="number"
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>

                            {isComercial ? (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Cliente Externo
                                    </label>
                                    <Input
                                        placeholder="Buscar cliente externo..."
                                        value={clienteExternoFilter}
                                        onChange={(e) => setClienteExternoFilter(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5 relative">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Cliente
                                    </label>
                                    <Input
                                        placeholder="Buscar empresa..."
                                        value={clientSearchTerm}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setClientSearchTerm(val);
                                            setClientDropdownOpen(true);
                                            if (!val) setClientFilter('all');
                                        }}
                                        onFocus={() => { if (clientSearchTerm) setClientDropdownOpen(true); }}
                                        onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                                        className="h-9"
                                    />
                                    {clientDropdownOpen && uniqueClients.length > 0 && (
                                        <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                                            {uniqueClients.map((name: string) => (
                                                <div
                                                    key={name}
                                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setClientFilter(name);
                                                        setClientSearchTerm(name);
                                                        setClientDropdownOpen(false);
                                                    }}
                                                >
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Soporte Técnico
                                </label>
                                <Select value={supportFilter} onValueChange={setSupportFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                                        {allSupports.map((support: any) => (
                                            <SelectItem key={support.id} value={support.id.toString()}>
                                                {support.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Asunto
                                </label>
                                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {uniqueSubjects.map((subject) => (
                                            <SelectItem key={subject} value={subject}>
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Serial
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="ABC123..."
                                        value={serialFilter}
                                        onChange={(e) => setSerialFilter(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Estado
                                </label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="Open">Abierto</SelectItem>
                                        <SelectItem value="In Progress">En Progreso</SelectItem>
                                        <SelectItem value="Closed">Cerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Desde
                                </label>
                                <Input
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Hasta
                                </label>
                                <Input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={tickets.data}
                        pagination={{
                            from: tickets.from,
                            to: tickets.to,
                            total: tickets.total,
                            links: tickets.links,
                            onPageChange: handlePageChange,
                        }}
                        getRowTooltip={(ticket) => ticket.address || undefined}
                    />
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden space-y-3">

                    {/* Botón para mostrar/ocultar filtros */}
                    <button
                        onClick={() => setShowMobileFilters(prev => !prev)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </span>
                        {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {/* Panel de filtros móvil */}
                    {showMobileFilters && (
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300"># Ticket</label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="123"
                                        value={ticketIdFilter}
                                        onChange={(e) => setTicketIdFilter(e.target.value)}
                                        type="number"
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>

                            {!isCustomerRole && (
                            <div className="flex flex-col gap-1.5">
                                {isComercial ? (
                                    <>
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente Externo</label>
                                        <Input
                                            placeholder="Buscar cliente externo..."
                                            value={clienteExternoFilter}
                                            onChange={(e) => setClienteExternoFilter(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Buscar empresa..."
                                                value={clientSearchTerm}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setClientSearchTerm(val);
                                                    setClientDropdownOpen(true);
                                                    if (!val) setClientFilter('all');
                                                }}
                                                onFocus={() => { if (clientSearchTerm) setClientDropdownOpen(true); }}
                                                onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                                                className="h-9 text-xs"
                                            />
                                            {clientDropdownOpen && uniqueClients.length > 0 && (
                                                <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                                                    {uniqueClients.map((name: string) => (
                                                        <div
                                                            key={name}
                                                            className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setClientFilter(name);
                                                                setClientSearchTerm(name);
                                                                setClientDropdownOpen(false);
                                                            }}
                                                        >
                                                            {name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            )}

                            {!isSupportRole && !isCustomerRole && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Soporte</label>
                                    <Select value={supportFilter} onValueChange={setSupportFilter}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                                            {allSupports.map((support: any) => (
                                                <SelectItem key={support.id} value={support.id.toString()}>
                                                    {support.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {!isSupportRole && !isCustomerRole && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Asunto</label>
                                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {uniqueSubjects.map((subject) => (
                                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial</label>
                                <div className="relative">
                                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="ABC123..."
                                        value={serialFilter}
                                        onChange={(e) => setSerialFilter(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="Open">Abierto</SelectItem>
                                        <SelectItem value="In Progress">En Progreso</SelectItem>
                                        <SelectItem value="Closed">Cerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
                                <DateFilterInput value={dateFromFilter} onChange={setDateFromFilter} className="text-xs" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
                                <DateFilterInput value={dateToFilter} onChange={setDateToFilter} className="text-xs" />
                            </div>
                        </div>
                    )}

                    {/* Tarjetas de tickets */}
                    {tickets.data.length > 0 ? (
                        tickets.data.map((ticket: Ticket) => (
                            <TicketMobileCard
                                key={ticket.id}
                                ticket={ticket}
                                onViewDetails={handleViewDetails}
                                canEdit={auth?.roles?.some(r => ['admin', 'Coordinador', 'customer', 'Comercial'].includes(r))}
                                canDuplicate={canDuplicate}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                            <SearchX className="h-10 w-10 opacity-30" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Sin resultados</p>
                                <p className="text-xs opacity-70 mt-0.5">Intenta ajustar los filtros de búsqueda</p>
                            </div>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}

                    {/* Paginación móvil */}
                    {tickets.links && tickets.links.length > 3 && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!tickets.links[0].url}
                                onClick={() => handlePageChange(tickets.links[0].url)}
                            >
                                ← Anterior
                            </Button>
                            <span className="text-xs text-gray-500 font-medium">
                                {tickets.from}–{tickets.to} de {tickets.total}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!tickets.links[tickets.links.length - 1].url}
                                onClick={() => handlePageChange(tickets.links[tickets.links.length - 1].url)}
                            >
                                Siguiente →
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedTicket(null);
                    }}
                />
            )}
        </AppLayout>
    );
}
