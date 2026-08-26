import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Customer, type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: '/customers',
    },
    {
        title: 'Editar',
        href: '',
    },
];

interface EditProps {
    customer: Customer
}

export default function Edit({customer}:EditProps) {

    const { data, setData, put, processing, errors } = useForm({
        name: customer.name || '',
        email: customer.email || '',
        name_user: customer.name_user || '',
        phone: customer.phone || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('customers.update', customer.id));
    };

    const handleCancel = () => {
        if(  data.name !== customer.name ||
             data.email !== customer.email ||
             data.name_user !== customer.name_user ||
             data.phone !== customer.phone
        ){
            if(!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) {
                return;
            }
        }
        router.visit(route('customers.index'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Editar Usuario" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Editar Usuario</h1>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>Información del Usuario</CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    autoFocus
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

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
                                <Label htmlFor="name_user">Nombre de Usuario</Label>
                                <Input
                                    id="name_user"
                                    value={data.name_user}
                                    onChange={(e) => setData('name_user', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name_user && <p className="text-sm text-red-500">{errors.name_user}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    disabled={processing}
                                 />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2">
                            <Button
                                type='button'
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type='submit'
                                disabled={processing}
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </div>
                                ) : (
                                    'Actualizar'
                                )}

                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
