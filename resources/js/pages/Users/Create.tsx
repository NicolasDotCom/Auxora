import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Role } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Loader2, Plus, X } from 'lucide-react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuarios', href: '/users' },
    { title: 'Crear', href: '' },
];

export default function Create() {
    const { roles, companyNames } = usePage<{ roles: Role[], companyNames: string[] }>().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        phone: '',
        speciality: '',
        name_user: '',
        nit: '',
        ciudad: '',
        additional_nits: [] as string[],
    });

    // Preparar opciones para el combobox de nombres de empresas
    const companyOptions = companyNames.map(name => ({
        value: name,
        label: name
    }));

    // Función para traducir nombres de roles al español
    const translateRole = (roleName: string) => {
        const translations: { [key: string]: string } = {
            'admin': 'Administrador',
            'customer': 'Cliente',
            'support': 'Soporte Técnico'
        };
        return translations[roleName] || roleName;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('users.store'));
    };

    const handleRoleChange = (value: string) => {
        setData('role', value);
        // Si el rol no es support, limpiar la especialidad
        if (value !== 'support') {
            setData('speciality', '');
        }
        // Si el rol no es customer, limpiar el name_user
        if (value !== 'customer') {
            setData('name_user', '');
            setData('nit', '');
            setData('additional_nits', []);
        }
    };

    const handleCancel = () => {
        if (data.name || data.email || data.phone || data.password || data.role || data.name_user) {
            if (!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) return;
        }
        router.visit(route('users.index'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Usuario" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Crear Usuario</h1>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>Información del Usuario</CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="role">Rol</Label>
                                <Select value={data.role} onValueChange={handleRoleChange} disabled={processing}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {translateRole(role.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="name">Nombre</Label>
                                <Combobox
                                    options={companyOptions}
                                    value={data.name}
                                    onValueChange={(value) => setData('name', value)}
                                    placeholder="Seleccionar o escribir nombre de empresa"
                                    searchPlaceholder="Buscar empresa..."
                                    emptyText="No se encontraron empresas."
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {data.role === 'customer' && (
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="name_user">Nombre de Usuario</Label>
                                    <Input
                                        id="name_user"
                                        value={data.name_user}
                                        onChange={(e) => setData('name_user', e.target.value)}
                                        disabled={processing}
                                        placeholder="Ingrese el nombre de usuario"
                                    />
                                    {errors.name_user && <p className="text-sm text-red-500">{errors.name_user}</p>}
                                </div>
                            )}

                            {data.role === 'customer' && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <Label>NIT</Label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => setData('additional_nits', [...data.additional_nits, ''])}
                                            disabled={processing}
                                        >
                                            <Plus className="h-3 w-3" /> Agregar NIT
                                        </Button>
                                    </div>
                                    <Input
                                        id="nit"
                                        value={data.nit}
                                        onChange={(e) => setData('nit', e.target.value)}
                                        disabled={processing}
                                        placeholder="Ej: 900123456-7"
                                    />
                                    {errors.nit && <p className="text-sm text-red-500">{errors.nit}</p>}
                                    {data.additional_nits.map((nit, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={nit}
                                                onChange={(e) => {
                                                    const updated = [...data.additional_nits];
                                                    updated[index] = e.target.value;
                                                    setData('additional_nits', updated);
                                                }}
                                                disabled={processing}
                                                placeholder={`NIT adicional ${index + 2}`}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="shrink-0 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() =>
                                                    setData(
                                                        'additional_nits',
                                                        data.additional_nits.filter((_, i) => i !== index),
                                                    )
                                                }
                                                disabled={processing}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    disabled={processing}
                                    placeholder="Ej: +573001234567"
                                />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="ciudad">Ciudad</Label>
                                <Input
                                    id="ciudad"
                                    type="text"
                                    value={data.ciudad}
                                    onChange={(e) => setData('ciudad', e.target.value)}
                                    disabled={processing}
                                    placeholder="Ej: Bogotá"
                                />
                                {errors.ciudad && <p className="text-sm text-red-500">{errors.ciudad}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation}</p>}
                            </div>

                            {data.role === 'support' && (
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="speciality">Especialidad</Label>
                                    <Select value={data.speciality} onValueChange={(value) => setData('speciality', value)} disabled={processing}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar especialidad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Impresoras">Impresoras</SelectItem>
                                            <SelectItem value="Sistemas">Sistemas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.speciality && <p className="text-sm text-red-500">{errors.speciality}</p>}
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                                    </>
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
