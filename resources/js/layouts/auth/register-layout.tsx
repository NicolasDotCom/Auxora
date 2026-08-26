import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface RegisterLayoutProps {
    title?: string;
    description?: string;
}

export default function RegisterLayout({ children, title, description }: PropsWithChildren<RegisterLayoutProps>) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm sm:max-w-md">
                <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-700">
                    <div className="flex flex-col items-center mb-6 sm:mb-8">                        <Link href={route('home')} className="flex flex-col items-center gap-3 sm:gap-4">
                            <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-24 sm:size-32 fill-current text-blue-500" />
                            </div>
                        </Link>
                        
                        <div className="text-center space-y-2 mt-3 sm:mt-4">
                            <h1 className="text-lg sm:text-xl font-semibold text-white">{title}</h1>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-gray-400">o</span>
                                <Link 
                                    href={route('login')} 
                                    className="text-blue-500 hover:text-blue-400 transition-colors"
                                >
                                    Iniciar sesión en su cuenta
                                </Link>
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
