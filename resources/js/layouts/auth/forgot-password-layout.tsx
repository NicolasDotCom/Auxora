import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface ForgotPasswordLayoutProps {
    title?: string;
    description?: string;
}

export default function ForgotPasswordLayout({ children, title, description }: PropsWithChildren<ForgotPasswordLayoutProps>) {
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
                                <Link 
                                    href={route('login')} 
                                    className="text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                                >
                                    <svg 
                                        className="w-4 h-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                                        />
                                    </svg>
                                    Volver al inicio de sesión
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
