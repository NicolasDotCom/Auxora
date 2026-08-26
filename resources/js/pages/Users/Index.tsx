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
import { type BreadcrumbItem, type PageProps, type UserWithRoles } from '@/types';
import { normalizePaginatedData } from '@/utils/pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, CheckCircle, XCircle, ShieldCheck, Filter, User2, Hash, Shield } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { UserMobileCard } from '@/components/user-mobile-card';
import { UserDetailModal } from '@/components/user-detail-modal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: '/users',
    },
];

export default function Index() {
    const { users, roles } = usePage<PageProps & { roles: { id: number; name: string }[] }>().props;
    const normalizedUsers = normalizePaginatedData<UserWithRoles>(users);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [recordIdToDelete, setRecordIdToDelete] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [nombreFilter, setNombreFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [nitFilter, setNitFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    const nombreRef  = useRef('');
    const roleRef    = useRef('');
    const nitRef     = useRef('');
    const estadoRef  = useRef('');

    const fireFilters = useCallback((
        nombre = nombreRef.current,
        role   = roleRef.current,
        nit    = nitRef.current,
        estado = estadoRef.current,
    ) => {
        const params: Record<string, string> = {};
        if (nombre) params.nombre = nombre;
        if (role)   params.role   = role;
        if (nit)    params.nit    = nit;
        if (estado) params.estado = estado;
        router.get(route('users.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['users'],
        });
    }, []);

    // Función para traducir nombres de roles al español
    const translateRole = (roleName: string) => {
        const translations: { [key: string]: string } = {
            'admin': 'Administrador',
            'customer': 'Cliente',
            'support': 'Soporte Técnico'
        };
        return translations[roleName] || roleName;
    };

    const columns: ColumnDef<UserWithRoles>[] = [
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
            id: 'roles',
            header: 'Roles',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1 text-xs">
                    {row.original.roles.map((role) => (
                        <span key={role.id} className="bg-muted rounded-md px-2 py-1">
                            {translateRole(role.name)}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            id: 'email_verified',
            header: 'Estado',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.email_verified_at ? (
                        <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verificado
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Sin verificar
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {!row.original.email_verified_at && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                                router.post(
                                    route('users.verify', row.original.id),
                                    {},
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Usuario verificado correctamente'),
                                    }
                                );
                            }}
                            title="Verificar usuario"
                        >
                            <ShieldCheck className="h-4 w-4" />
                        </Button>
                    )}
                    <Link href={route('users.edit', row.original.id)}>
                        <Button size="sm" variant="default">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            setRecordIdToDelete(row.original.id);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleSearch = useCallback((searchTerm: string) => {
        nombreRef.current = searchTerm;
        fireFilters(searchTerm);
    }, [fireFilters]);

    // Debounce para los filtros específicos
    const isMountedRef = useRef(false);
    useEffect(() => {
        if (!isMountedRef.current) { isMountedRef.current = true; return; }
        nombreRef.current = nombreFilter;
        nitRef.current    = nitFilter;
        const timer = setTimeout(() => fireFilters(), 400);
        return () => clearTimeout(timer);
    }, [nombreFilter, nitFilter, fireFilters]);

    // Efecto inmediato para selects
    useEffect(() => {
        if (!isMountedRef.current) return;
        roleRef.current   = roleFilter;
        estadoRef.current = estadoFilter;
        fireFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter, estadoFilter]);

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['users'],
            });
        }
    }, []);

    const handleViewDetails = (user: UserWithRoles) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const filteredMobileUsers = normalizedUsers.data;

    const clearFilters = () => {
        setNombreFilter('');
        setRoleFilter('');
        setNitFilter('');
        setEstadoFilter('');
        nombreRef.current  = '';
        roleRef.current    = '';
        nitRef.current     = '';
        estadoRef.current  = '';
        router.get(route('users.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['users'],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Usuarios</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Cuentas de acceso y roles del sistema</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="w-full sm:w-auto border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                            Limpiar Filtros
                        </Button>
                        <Link href={route('users.create')}>
                            <Button className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Agregar Usuario
                            </Button>
                        </Link>
                    </div>
                </div>

                <Separator />

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-muted/40">
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
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rol</label>
                        <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                <SelectValue placeholder="Todos los roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los roles</SelectItem>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>
                                        {translateRole(role.name)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                        <Select value={estadoFilter || 'all'} onValueChange={(v) => setEstadoFilter(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="verified">Verificado</SelectItem>
                                <SelectItem value="unverified">Sin verificar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="hidden md:block">
                    <DataTable
                        columns={columns}
                        data={normalizedUsers.data}
                        pagination={{
                            from: normalizedUsers.from,
                            to: normalizedUsers.to,
                            total: normalizedUsers.total,
                            links: normalizedUsers.links,
                            onPageChange: handlePageChange,
                        }}
                        onRowClick={handleViewDetails}
                    />
                </div>

                {/* Vista Móvil */}
                <div className="md:hidden space-y-4">
                    <div className="space-y-3">
                        {filteredMobileUsers.length > 0 ? (
                            filteredMobileUsers.map((user: UserWithRoles) => (
                                <UserMobileCard
                                    key={user.id}
                                    user={user}
                                    onViewDetails={handleViewDetails}
                                    onDelete={(userId) => {
                                        setRecordIdToDelete(userId);
                                        setIsDialogOpen(true);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No se encontraron usuarios
                            </div>
                        )}
                    </div>

                    {normalizedUsers.links && normalizedUsers.links.length > 3 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {normalizedUsers.links[0].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedUsers.links[0].url)}
                                >
                                    Anterior
                                </Button>
                            )}
                            <span className="flex items-center px-3 text-sm text-gray-600">
                                {normalizedUsers.from} - {normalizedUsers.to} de {normalizedUsers.total}
                            </span>
                            {normalizedUsers.links[normalizedUsers.links.length - 1].url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(normalizedUsers.links[normalizedUsers.links.length - 1].url)}
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
                            <AlertDialogDescription>Este usuario será eliminado permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (recordIdToDelete) {
                                        router.post(route('users.destroy', recordIdToDelete), {
                                            _method: 'delete',
                                        }, {
                                            onSuccess: () => toast.success('Usuario eliminado correctamente'),
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
                <UserDetailModal
                    user={selectedUser}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    canEdit={true}
                />
            </div>
        </AppLayout>
    );
}
