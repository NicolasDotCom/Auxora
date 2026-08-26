import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PageProps, Role } from '@/types';
import { normalizePaginatedData } from '@/utils/pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCallback } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

export default function Index() {
    const { roles } = usePage<PageProps>().props;
    //normalizamos los datos de roles
    const normalizedRoles = normalizePaginatedData<Role>(roles);

    // Función para traducir nombres de roles
    const translateRole = (roleName: string) => {
        const translations: { [key: string]: string } = {
            'admin': 'Administrador',
            'customer': 'Cliente',
            'support': 'Soporte',
            'guest': 'Invitado',
            'Coordinador': 'Coordinador'
        };
        return translations[roleName] || roleName;
    };

    const columns: ColumnDef<Role>[] = [
        {
            header: 'Rol',
            accessorKey: 'name',
            cell: (info: any) => translateRole(info.getValue()),
        },
        {
            header: 'Permisos',
            accessorKey: 'permissions_count',
            cell: (info: any) => info.getValue(),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }: any) => (
                <Link href={route('roles.edit', { role: row.original.id })}>
                    <Button size="sm" variant="default">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </Link>
            ),
        },
    ];

    const handleSearch = useCallback((searchTerm: string) => {
        router.get(
            route('roles.index'),
            { search: searchTerm },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['roles'],
            },
        );
    }, []);

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['roles'],
            });
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Roles</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Gestión de roles y permisos del sistema</p>
                    </div>
                    <Link href={route('roles.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Rol
                        </Button>
                    </Link>
                </div>

                <Separator />

                <DataTable
                    columns={columns}
                    data={normalizedRoles.data}
                    pagination={{
                        from: normalizedRoles.from,
                        to: normalizedRoles.to,
                        total: normalizedRoles.total,
                        links: normalizedRoles.links,
                        onPageChange: handlePageChange,
                    }}
                    onSearch={handleSearch}
                    searchPlaceholder="Buscar..."
                />
            </div>
        </AppLayout>
    );
}
