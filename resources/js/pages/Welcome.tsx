import { Head, Link, usePage } from '@inertiajs/react';
import { Shield, Users, Wrench, User as UserIcon, AlertTriangle, LogIn, UserPlus, Github, ExternalLink, RefreshCw } from 'lucide-react';

interface RoleCard {
    slug: string;
    label: string;
    email: string;
    description: string;
    color: string;
}

interface WelcomeProps {
    demoEnabled: boolean;
    roles: RoleCard[];
    publicRegistration: boolean;
}

const ICONS: Record<string, typeof Shield> = {
    admin: Shield,
    Coordinador: Users,
    support: Wrench,
    customer: UserIcon,
};

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; btn: string }> = {
    purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-300', btn: 'bg-purple-600 hover:bg-purple-700' },
    blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   text: 'text-blue-300',   btn: 'bg-blue-600 hover:bg-blue-700' },
    green:  { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    amber:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  btn: 'bg-amber-600 hover:bg-amber-700' },
};

export default function Welcome({ demoEnabled, roles, publicRegistration }: WelcomeProps) {
    const { props } = usePage<{ app: { url: string }; name: string }>();
    const appUrl = props?.app?.url ?? (typeof window !== 'undefined' ? window.location.origin : '');

    return (
        <>
            <Head title="Auxora — Demo" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
                {/* Demo banner */}
                {demoEnabled && (
                    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-100">
                        <AlertTriangle className="mr-2 inline-block h-4 w-4" />
                        Entorno demo — los datos se reinician automáticamente cada noche.
                    </div>
                )}

                {/* Hero */}
                <header className="mx-auto max-w-5xl px-6 pb-8 pt-16 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        Live demo
                    </div>
                    <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
                        Auxora
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                        Sistema de gestión de tickets de soporte técnico. Elige un rol para entrar al instante
                        o regístrate como nuevo cliente.
                    </p>
                </header>

                {/* Role cards */}
                <main className="mx-auto max-w-5xl px-6 pb-12">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Entrar con 1-click
                    </h2>

                    {roles.length === 0 ? (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-center text-amber-200">
                            <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                            <p className="font-medium">Aún no hay usuarios demo sembrados.</p>
                            <p className="mt-1 text-sm">
                                Ejecuta <code className="rounded bg-slate-800 px-2 py-0.5">php artisan db:seed --class=DemoDataSeeder</code> en el servidor.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {roles.map((role) => {
                                const Icon = ICONS[role.slug] ?? UserIcon;
                                const colors = COLOR_CLASSES[role.color] ?? COLOR_CLASSES.blue;
                                return (
                                    <div
                                        key={role.slug}
                                        className={`group relative overflow-hidden rounded-xl border ${colors.border} bg-slate-900/60 p-6 backdrop-blur transition-all hover:scale-[1.02] hover:bg-slate-900/80`}
                                    >
                                        <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${colors.bg} blur-2xl`} />
                                        <div className="relative flex items-start gap-4">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold">{role.label}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{role.description}</p>
                                                <a
                                                    href={route('demo.login-as', { role: role.slug })}
                                                    className={`mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${colors.btn}`}
                                                >
                                                    <LogIn className="h-4 w-4" />
                                                    Entrar como {role.label}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Self-registration (solo demo) */}
                    {demoEnabled && publicRegistration && (
                        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/40 p-6 text-center">
                            <h3 className="text-lg font-semibold">¿Quieres probar como usuario nuevo?</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Regístrate con tu email (recibirás un enlace de verificación) o usa el login clásico.
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-3">
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Registrarme
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login con password
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Fallback: si NO es demo, solo mostrar login clásico */}
                    {!demoEnabled && (
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <LogIn className="h-4 w-4" />
                                Iniciar sesión
                            </Link>
                        </div>
                    )}

                    {/* Tech stack */}
                    <div className="mt-12 grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                        {[
                            { label: 'Laravel', value: '13' },
                            { label: 'PHP', value: '8.3' },
                            { label: 'React + Inertia', value: '19 · v3' },
                            { label: 'VPS + Coolify', value: 'Docker' },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                                <div className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</div>
                                <div className="mt-1 font-mono text-lg font-semibold text-slate-200">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800 bg-slate-950/60 px-6 py-6">
                    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Datos reseteados cada noche · Sesión demo: 2 h</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                href={appUrl}
                                className="flex items-center gap-1 hover:text-slate-200"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Auxora</span>
                            </a>
                            <span className="text-slate-700">·</span>
                            <span>Hecho con Laravel + Inertia + React</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}