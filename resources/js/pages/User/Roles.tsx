import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { PageProps, Role, UserWithRoles, PaginatedData } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { BreadcrumbItem } from '@/types';
import { RoleMobileCard } from '@/components/role-mobile-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles de Usuario',
        href: '/users/roles',
    },
];
export default function UserRolesPage() {
    const { users, roles } = usePage<PageProps>().props;

    const usersList: UserWithRoles[] = Array.isArray(users) ? users : users.data;
    const roleItems: Role[] = Array.isArray(roles) ? roles : roles.data;
    const [mobileSearchTerm, setMobileSearchTerm] = useState('');

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

    const initialRoles: Record<number, string> = {};
    usersList.forEach((user) => {
        initialRoles[user.id] = user.roles?.[0]?.name || '';
    });

    const { data, setData, put, processing } = useForm<{ roles: Record<number, string> }>({
        roles: initialRoles,
    });

    const handleChange = (userId: number, role: string) => {
        setData('roles', {
            ...data.roles,
            [userId]: role,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.roles.update'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleCancel = () => {
        router.visit(route('dashboard'));
    };

    const columns = [
        {
            header: 'Nombre',
            accessorKey: 'name',
        },
        {
            header: 'Correo',
            accessorKey: 'email',
        },
        {
            header: 'Rol',
            id: 'role',
            cell: ({ row }: { row: { original: UserWithRoles } }) => (
                <Select value={data.roles[row.original.id]} onValueChange={(value) => handleChange(row.original.id, value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                        {roleItems.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                                {translateRole(role.name)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
    ];

    const handleSearch = useCallback((searchTerm: string) => {
        router.get(
            route('users.roles.index'),
            { search: searchTerm },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['users'],
            },
        );
    }, []);

    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, undefined, {
                preserveState: true,
                preserveScroll: true,
                only: ['users'],
            });
        }
    }, []);

    const paginatedUsers = users as PaginatedData<UserWithRoles>;

    const filteredMobileUsers = paginatedUsers.data.filter((user: UserWithRoles) => {
        if (!mobileSearchTerm) return true;
        const searchLower = mobileSearchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            translateRole(data.roles[user.id]).toLowerCase().includes(searchLower)
        );
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asignar Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-2 sm:p-4">
                <h1 className="text-xl sm:text-2xl font-bold">Asignar Roles a Usuarios</h1>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Vista Desktop */}
                    <div className="hidden md:block">
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <DataTable
                                    columns={columns}
                                    data={paginatedUsers.data}
                                    pagination={{
                                        from: paginatedUsers.from,
                                        to: paginatedUsers.to,
                                        total: paginatedUsers.total,
                                        links: paginatedUsers.links,
                                        onPageChange: handlePageChange,
                                    }}
                                    onSearch={handleSearch}
                                    searchPlaceholder="Buscar usuarios..."
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 p-4 sm:p-6">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Guardar
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Vista Móvil */}
                    <div className="md:hidden space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar usuarios..."
                                value={mobileSearchTerm}
                                onChange={(e) => setMobileSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="space-y-3">
                            {filteredMobileUsers.length > 0 ? (
                                filteredMobileUsers.map((user: UserWithRoles) => (
                                    <RoleMobileCard
                                        key={user.id}
                                        user={user}
                                        currentRole={data.roles[user.id]}
                                        roles={roleItems}
                                        onRoleChange={handleChange}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No se encontraron usuarios
                                </div>
                            )}
                        </div>

                        {paginatedUsers.links && paginatedUsers.links.length > 3 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {paginatedUsers.links[0].url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(paginatedUsers.links[0].url)}
                                    >
                                        Anterior
                                    </Button>
                                )}
                                <span className="flex items-center px-3 text-sm text-gray-600">
                                    {paginatedUsers.from} - {paginatedUsers.to} de {paginatedUsers.total}
                                </span>
                                {paginatedUsers.links[paginatedUsers.links.length - 1].url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(paginatedUsers.links[paginatedUsers.links.length - 1].url)}
                                    >
                                        Siguiente
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Botones de acción móvil */}
                        <div className="flex flex-col gap-2 pt-4 border-t">
                            <Button type="submit" disabled={processing} className="w-full">
                                Guardar Cambios
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel} className="w-full">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
