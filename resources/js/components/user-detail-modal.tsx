import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { UserWithRoles } from '@/types';
import { Pencil, Mail, Calendar, ShieldCheck, ShieldAlert, UserCircle2, Hash } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface UserDetailModalProps {
    user: UserWithRoles | null;
    isOpen: boolean;
    onClose: () => void;
    canEdit?: boolean;
}

const translateRole = (roleName: string) => {
    const translations: { [key: string]: string } = {
        'admin': 'Administrador',
        'customer': 'Cliente',
        'support': 'Soporte Técnico',
        'comercial': 'Comercial'
    };
    return translations[roleName] || roleName;
};

const getRoleBadgeColor = (roleName: string) => {
    const colors: { [key: string]: string } = {
        'admin': 'bg-red-100 text-red-700',
        'customer': 'bg-blue-100 text-blue-700',
        'support': 'bg-green-100 text-green-700',
        'comercial': 'bg-purple-100 text-purple-700'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-700';
};

export function UserDetailModal({ user, isOpen, onClose, canEdit = true }: UserDetailModalProps) {
    if (!user) return null;

    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    const primaryRole = user.roles[0]?.name || 'user';
    const headerColors: Record<string, string> = {
        admin: 'from-red-600 to-red-700',
        support: 'from-violet-600 to-violet-700',
        customer: 'from-sky-600 to-sky-700',
        Comercial: 'from-amber-600 to-amber-700',
        Coordinador: 'from-pink-600 to-pink-700',
    };
    const headerGradient = headerColors[primaryRole] ?? 'from-slate-600 to-slate-700';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-full p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className={`relative bg-gradient-to-br ${headerGradient} px-6 pt-6 pb-8 text-white rounded-t-lg`}>
                    <DialogTitle className="sr-only">Detalle del usuario {user.name}</DialogTitle>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-inner">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold leading-tight truncate">{user.name}</h2>
                            <p className="text-white/70 text-sm truncate">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {user.roles.map((role) => (
                                    <span
                                        key={role.id}
                                        className="inline-block text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-medium"
                                    >
                                        {translateRole(role.name)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-2 divide-y divide-border/50">
                    <div className="flex items-start gap-3 py-3">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Nombre completo</p>
                            <p className="text-sm font-medium mt-0.5">{user.name}</p>
                        </div>
                    </div>
                    {user.customer?.name_user && (
                        <div className="flex items-start gap-3 py-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Nombre de usuario</p>
                                <p className="text-sm font-medium mt-0.5">{user.customer.name_user}</p>
                            </div>
                        </div>
                    )}
                    {user.customer?.nit && (
                        <div className="flex items-start gap-3 py-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">NIT</p>
                                <p className="text-sm font-medium mt-0.5">{user.customer.nit}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3 py-3">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Correo electrónico</p>
                            <p className="text-sm font-medium mt-0.5 break-words">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                        <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            user.email_verified_at ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'
                        }`}>
                            {user.email_verified_at
                                ? <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                : <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Estado del correo</p>
                            <p className={`text-sm font-medium mt-0.5 ${
                                user.email_verified_at ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                            }`}>
                                {user.email_verified_at ? 'Verificado' : 'Sin verificar'}
                            </p>
                            {user.email_verified_at && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(user.email_verified_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    {' · '}
                                    {new Date(user.email_verified_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Fecha de registro</p>
                            <p className="text-sm font-medium mt-0.5">
                                {new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(user.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t bg-muted/30">
                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                        Cerrar
                    </Button>
                    {canEdit && (
                        <Link href={route('users.edit', user.id)} className="flex-1 sm:flex-none">
                            <Button className="w-full">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar usuario
                            </Button>
                        </Link>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
