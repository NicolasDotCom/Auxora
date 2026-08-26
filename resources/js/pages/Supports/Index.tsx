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
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { PageProps, Support, type BreadcrumbItem } from '@/types';
import { normalizePaginatedData } from '@/utils/pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, User2, Phone, Filter } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { SupportMobileCard } from '@/components/support-mobile-card';
import { SupportDetailModal } from '@/components/support-detail-modal';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Soporte Técnico',
        href: '/supports',
    },
];

export default function Index() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSupport, setSelectedSupport] = useState<Support | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [nombreFilter, setNombreFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [specialityFilter, setSpecialityFilter] = useState('');

    const nombreRef     = useRef('');
    const phoneRef      = useRef('');
    const specialityRef = useRef('');

    const fireFilters = useCallback((
        nombre     = nombreRef.current,
        phone      = phoneRef.current,
        speciality = specialityRef.current,
    ) => {
        const params: Record<string, string> = {};
        if (nombre)     params.nombre     = nombre;
        if (phone)      params.phone      = phone;
        if (speciality) params.speciality = speciality;
        router.get(route('supports.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['supports'],
        });
    }, []);

    const { supports } = usePage<PageProps>().props;
    const normalizedSupports = normalizePaginatedData<Support>(supports);

    const columns: ColumnDef<Support>[] = [
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
            header: 'Correo',
        },
        {
            accessorKey: 'phone',
            header: 'Teléfono',
        },
        {
            accessorKey: 'speciality',
            header: 'Especialidad',
        },
    ];

    // Debounce para los filtros
    const isMountedRef = useRef(false);
    useEffect(() => {
        if (!isMountedRef.current) { isMountedRef.current = true; return; }
        nombreRef.current = nombreFilter;
        phoneRef.current  = phoneFilter;
        const timer = setTimeout(() => fireFilters(), 400);
        return () => clearTimeout(timer);
    }, [nombreFilter, phoneFilter, fireFilters]);

    // Efecto inmediato para el select de especialidad
    useEffect(() => {
        if (!isMountedRef.current) return;
        specialityRef.current = specialityFilter;
        fireFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [specialityFilter]);

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['supports'],
            });
        }
    }, []);

    const handleViewDetails = (support: Support) => {
        setSelectedSupport(support);
        setIsDetailModalOpen(true);
    };

    const filteredMobileSupports = normalizedSupports.data;

    const clearFilters = () => {
        setNombreFilter('');
        setPhoneFilter('');
        setSpecialityFilter('');
        nombreRef.current     = '';
        phoneRef.current      = '';
        specialityRef.current = '';
        router.get(route('supports.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['supports'],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Soporte Técnico" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Soporte Técnico</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Administración del personal de soporte técnico</p>
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

                {/* Filtros específicos: nombre, teléfono, especialidad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                    <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Nombre</label>
                        <div className="relative">
                            <User2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Buscar nombre..."
                                value={nombreFilter}
                                onChange={(e) => setNombreFilter(e.target.value)}
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
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Especialidad</label>
                        <Select value={specialityFilter || 'all'} onValueChange={(v) => setSpecialityFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todas las especialidades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las especialidades</SelectItem>
                                <SelectItem value="Impresoras">Impresoras</SelectItem>
                                <SelectItem value="Sistemas">Sistemas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Vista Desktop */}
                <div className="hidden md:block">
                    <DataTable
                        columns={columns}
                        data={normalizedSupports.data}
                        pagination={{
                            from: normalizedSupports.from,
                            to: normalizedSupports.to,
                            total: normalizedSupports.total,
                            links: normalizedSupports.links,
                            onPageChange: handlePageChange,
                        }}
                        onRowClick={handleViewDetails}
                    />
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden space-y-4">
                    <div className="space-y-3">
                        {filteredMobileSupports.length > 0 ? (
                            filteredMobileSupports.map((support: Support) => (
                                <SupportMobileCard
                                    key={support.id}
                                    support={support}
                                    onViewDetails={handleViewDetails}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No se encontraron soportes
                            </div>
                        )}
                    </div>

                    {normalizedSupports.links && normalizedSupports.links.length > 3 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {normalizedSupports.links[0].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedSupports.links[0].url)}
                                >
                                    Anterior
                                </Button>
                            )}
                            <span className="flex items-center px-3 text-sm text-gray-600">
                                {normalizedSupports.from} - {normalizedSupports.to} de {normalizedSupports.total}
                            </span>
                            {normalizedSupports.links[normalizedSupports.links.length - 1].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedSupports.links[normalizedSupports.links.length - 1].url)}
                                >
                                    Siguiente
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedSupport?.tickets_count && selectedSupport.tickets_count > 0 ? (
                                    <span className="font-semibold text-red-600">
                                        Este soporte tiene {selectedSupport.tickets_count} ticket{selectedSupport.tickets_count > 1 ? 's' : ''}{' '}
                                        asignado{selectedSupport.tickets_count > 1 ? 's' : ''}. No puedes eliminarlo mientras existan tickets.
                                    </span>
                                ) : (
                                    'Esta acción no se puede deshacer. El registro se eliminará permanentemente.'
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            {selectedSupport?.tickets_count === 0 && (
                                <AlertDialogAction
                                    onClick={() => {
                                        if (selectedSupport) {
                                            router.delete(route('supports.destroy', selectedSupport.id), {
                                                onSuccess: () => toast.success('Soporte eliminado correctamente'),
                                            });
                                        }
                                    }}
                                >
                                    Eliminar
                                </AlertDialogAction>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Modal de detalles */}
                <SupportDetailModal
                    support={selectedSupport}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
