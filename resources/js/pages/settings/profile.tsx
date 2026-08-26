import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useAuth } from '@/hooks/use-auth';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de perfil',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const { isAdmin } = useAuth();

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Solo permitir envío si es admin
        if (!isAdmin()) {
            return;
        }

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Información del perfil" 
                        description={isAdmin() ? "Actualiza tu nombre y correo electrónico" : "Ver la información de tu perfil"} 
                    />

                    {isAdmin() ? (
                        // Formulario editable para administradores
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Nombre completo"
                                />
                                <InputError className="mt-2" message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Correo electrónico"
                                />
                                <InputError className="mt-2" message={errors.email} />
                            </div>

                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div>
                                    <p className="text-muted-foreground -mt-4 text-sm">
                                        Tu correo electrónico no está verificado.{' '}
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                        >
                                            Haz clic aquí para reenviar el correo de verificación.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600">
                                            Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Guardar</Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">Guardado</p>
                                </Transition>
                            </div>
                        </form>
                    ) : (
                        // Vista de solo lectura para clientes y técnicos
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    className="mt-1 block w-full bg-gray-50 dark:bg-gray-800"
                                    value={auth.user.name}
                                    readOnly
                                    disabled
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full bg-gray-50 dark:bg-gray-800"
                                    value={auth.user.email}
                                    readOnly
                                    disabled
                                />
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-200/10 dark:bg-blue-700/10">
                                <div className="relative space-y-0.5 text-blue-700 dark:text-blue-100">
                                    <p className="font-medium">Información</p>
                                    <p className="text-sm">
                                        Solo los administradores pueden editar la información del perfil. 
                                        Si necesitas cambiar tu nombre o correo electrónico, contacta a un administrador del sistema.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
