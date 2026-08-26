import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { PageProps, Role, BreadcrumbItem, Permission } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
    {
        title: 'Editar',
        href: '#',
    },
];

export default function Edit() {
    const { role, permissions, rolePermissions } = usePage<
        PageProps & {
            role: Role;
            permissions: Record<string, Permission[]>;
            rolePermissions: string[];
        }
    >().props;

    const { data, setData, put, processing } = useForm({
        permissions: rolePermissions,
    });

    // Función para traducir nombres de entidades
    const translateEntity = (entity: string) => {
        const translations: { [key: string]: string } = {
            'ticket': 'Ticket',
            'status': 'Estado',
            'customer': 'Cliente',
            'support': 'Soporte',
            'analytics': 'Análisis',
            'api': 'API',
        };
        return translations[entity.toLowerCase()] || entity;
    };

    // Función para traducir nombres de permisos
    const translatePermission = (permission: string) => {
        const translations: { [key: string]: string } = {
            'view ticket': 'ver ticket',
            'create ticket': 'crear ticket',
            'edit ticket': 'editar ticket',
            'reopen ticket': 'reabrir ticket',
            'update status ticket': 'actualizar estado ticket',
            'view customer': 'ver cliente',
            'create customer': 'crear cliente',
            'edit customer': 'editar cliente',
            'delete customer': 'eliminar cliente',
            'view support': 'ver soporte',
            'create support': 'crear soporte',
            'edit support': 'editar soporte',
            'delete support': 'eliminar soporte',
            'view analytics': 'estadísticas de técnicos',
            'export analytics': 'exportación de tickets',
            'stats analytics': 'estadística de tickets',
            'view api': 'ver api',
            'manage api': 'administrar api',
        };
        return translations[permission.toLowerCase()] || permission;
    };

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

    const handleCheckboxChange = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData(
                'permissions',
                data.permissions.filter((p) => p !== permissionName)
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update', { role: role.id }));
    };

    const handleCancel = () => {
        router.visit(route('roles.index'));
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Rol - ${translateRole(role.name)}`} />
             <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Editar Rol: {translateRole(role.name)}</h1>
                <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <CardContent className="flex flex-col gap-4">
                    {Object.entries(permissions).map(([entity, perms]) => (
                        <div key={entity} className="space-y-2 mt-6 first:mt-0">
                            <h2 className="text-lg font-semibold capitalize">{translateEntity(entity)}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {perms.map((permission) => (
                                    <div key={permission.id} className="flex items-center gap-2 min-w-0">
                                        <Checkbox
                                            id={`perm-${permission.id}`}
                                            checked={data.permissions.includes(permission.name)}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(permission.name, !!checked)
                                            }
                                        />
                                        <label
                                            htmlFor={`perm-${permission.id}`}
                                            className="text-sm"
                                        >
                                            {translatePermission(permission.name)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </div>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </CardFooter>
                </form>
                </Card>
            </div>
        </AppLayout>
    );
}
