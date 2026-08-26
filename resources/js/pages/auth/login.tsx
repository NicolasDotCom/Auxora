import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import LoginLayout from '@/layouts/auth/login-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <LoginLayout title="Entre a su cuenta">
            <Head title="Iniciar Sesión" />

            <form className="space-y-5 sm:space-y-6" onSubmit={submit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder=""
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="password" className="text-white text-sm font-medium">
                                Contraseña
                            </label>
                            {canResetPassword && (
                                <TextLink 
                                    href={route('password.request')} 
                                    className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm transition-colors" 
                                    tabIndex={5}
                                >
                                    ¿Ha olvidado su contraseña?
                                </TextLink>
                            )}
                        </div>
                        <input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder=""
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3 pt-1">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="border-gray-600"
                        />
                        <label htmlFor="remember" className="text-white text-sm">
                            Recordarme
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 sm:py-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base mt-6" 
                        tabIndex={4} 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Entrar
                    </button>
                </div>
            </form>

            {status && <div className="mt-4 text-center text-sm font-medium text-green-400">{status}</div>}
        </LoginLayout>
    );
}
