import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { Customer, PageProps, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, Building2, Hash, Phone, Filter } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { useCallback, useState, useEffect, useRef } from 'react';
import { normalizePaginatedData } from '@/utils/pagination';
import { CustomerMobileCard } from '@/components/customer-mobile-card';
import { CustomerDetailModal } from '@/components/customer-detail-modal';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: '/customers',
    },
];

export default function Index() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [recordIdToDelete, setRecordIdToDelete] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [nombreFilter, setNombreFilter] = useState('');
    const [nitFilter, setNitFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');

    // Refs para acceso sin stale closures en el efecto combinado
    const nombreRef = useRef('');
    const nitRef    = useRef('');
    const phoneRef  = useRef('');

    const fireFilters = useCallback((
        nombre = nombreRef.current,
        nit    = nitRef.current,
        phone  = phoneRef.current,
    ) => {
        const params: Record<string, string> = {};
        if (nombre) params.nombre = nombre;
        if (nit)    params.nit    = nit;
        if (phone)  params.phone  = phone;
        router.get(route('customers.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['customers'],
        });
    }, []);

    const { customers } = usePage<PageProps>().props;
    //normalizamos los datos de customers
    const normalizedCustomers = normalizePaginatedData<Customer>(customers);

        const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
        },
        {
            accessorKey: 'name',
            header: 'Nombre',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'name_user',
            header: 'Nombre de Usuario',
        },
        {
            accessorKey: 'phone',
            header: 'Teléfono',
        },
        {
            accessorKey: 'tickets_count',
            header: 'Tickets',
        },
    ];

    // Debounce para los filtros
    const isMountedRef = useRef(false);
    useEffect(() => {
        if (!isMountedRef.current) { isMountedRef.current = true; return; }
        nombreRef.current = nombreFilter;
        nitRef.current    = nitFilter;
        phoneRef.current  = phoneFilter;
        const timer = setTimeout(() => fireFilters(), 400);
        return () => clearTimeout(timer);
    }, [nombreFilter, nitFilter, phoneFilter, fireFilters]);

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['customers'],
            });
        }
    }, []);

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailModalOpen(true);
    };

    const filteredMobileCustomers = normalizedCustomers.data;

    const clearFilters = () => {
        setNombreFilter('');
        setNitFilter('');
        setPhoneFilter('');
        nombreRef.current = '';
        nitRef.current    = '';
        phoneRef.current  = '';
        router.get(route('customers.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['customers'],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clientes</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Empresas y usuarios clientes registrados</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full sm:w-auto border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                        Limpiar Filtros
                    </Button>
                </div>

                <Separator />

                {/* Filtros específicos: empresa, NIT, teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                    <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Empresa</label>
                        <div className="relative">
                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Buscar empresa..."
                                value={nombreFilter}
                                onChange={(e) => setNombreFilter(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">NIT</label>
                        <div className="relative">
                            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Buscar NIT..."
                                value={nitFilter}
                                onChange={(e) => setNitFilter(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Buscar teléfono..."
                                value={phoneFilter}
                                onChange={(e) => setPhoneFilter(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                </div>

                {/* Vista Desktop */}
                <div className="hidden md:block">
                    <DataTable
                        columns={columns}
                        data={normalizedCustomers.data}
                        pagination={{
                            from: normalizedCustomers.from,
                            to: normalizedCustomers.to,
                            total: normalizedCustomers.total,
                            links: normalizedCustomers.links,
                            onPageChange: handlePageChange,
                        }}
                        onRowClick={handleViewDetails}
                    />
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden space-y-4">
                    <div className="space-y-3">
                        {filteredMobileCustomers.length > 0 ? (
                            filteredMobileCustomers.map((customer: Customer) => (
                                <CustomerMobileCard
                                    key={customer.id}
                                    customer={customer}
                                    onViewDetails={handleViewDetails}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No se encontraron clientes
                            </div>
                        )}
                    </div>

                    {normalizedCustomers.links && normalizedCustomers.links.length > 3 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {normalizedCustomers.links[0].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedCustomers.links[0].url)}
                                >
                                    Anterior
                                </Button>
                            )}
                            <span className="flex items-center px-3 text-sm text-gray-600">
                                {normalizedCustomers.from} - {normalizedCustomers.to} de {normalizedCustomers.total}
                            </span>
                            {normalizedCustomers.links[normalizedCustomers.links.length - 1].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedCustomers.links[normalizedCustomers.links.length - 1].url)}
                                >
                                    Siguiente
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ✅ Dialog fuera del loop, muestra si tiene tickets */}
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedCustomer?.tickets_count && selectedCustomer.tickets_count > 0 ? (
                                    <span className="text-red-600 font-semibold">
                                        Este usuario tiene {selectedCustomer.tickets_count} ticket{selectedCustomer.tickets_count > 1 ? 's' : ''}. Al eliminarlo también se eliminarán todos los tickets asociados.
                                    </span>
                                ) : (
                                    'El registro será eliminado permanentemente.'
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>

                            <AlertDialogAction
                                onClick={() => {
                                    if (recordIdToDelete) {
                                        router.post(route('customers.destroy', recordIdToDelete), {
                                            _method: 'delete',
                                            confirm: true,
                                        });

                                    }
                                }}
                            >
                                Eliminar
                            </AlertDialogAction>

                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Modal de detalles */}
                <CustomerDetailModal
                    customer={selectedCustomer}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}

