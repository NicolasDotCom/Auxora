// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import ForgotPasswordLayout from '@/layouts/auth/forgot-password-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <ForgotPasswordLayout title="¿Olvidaste tu contraseña?">
            <Head title="Olvidé mi contraseña" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-400">{status}</div>}

            <form className="space-y-5 sm:space-y-6" onSubmit={submit}>
                <div className="space-y-4">                    <div>
                        <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder="email@ejemplo.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 sm:py-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base mt-6" 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Enviar email
                    </button>
                </div>
            </form>
        </ForgotPasswordLayout>
    );
}
