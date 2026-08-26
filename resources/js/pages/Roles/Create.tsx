import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { PageProps, BreadcrumbItem, Permission } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
    {
        title: 'Crear',
        href: '#',
    },
];

export default function Create() {
    const { permissions } = usePage<PageProps & { permissions: Record<string, Permission[]>;}>().props;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as string[],
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
        post(route('roles.store'));
    };

    const handleCancel = () => {
        router.visit(route('roles.index'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Rol" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Crear Nuevo Rol</h1>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <CardContent className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Rol</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ingrese el nombre del rol"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                            {Object.entries(permissions).map(([entity, perms]) => (
                                <div key={entity} className="space-y-2 mt-6 first:mt-0">
                                    <h2 className="text-lg font-semibold capitalize">{translateEntity(entity)}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {perms.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-center gap-2 min-w-0"
                                            >
                                                <Checkbox
                                                    id={`perm-${permission.id}`}
                                                    checked={data.permissions.includes(
                                                        permission.name
                                                    )}
                                                    onCheckedChange={(checked) =>
                                                        handleCheckboxChange(
                                                            permission.name,
                                                            !!checked
                                                        )
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creando...
                                    </div>
                                ) : (
                                    'Crear Rol'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
