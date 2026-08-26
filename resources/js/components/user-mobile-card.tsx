import { UserWithRoles } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';

interface UserMobileCardProps {
    user: UserWithRoles;
    onViewDetails: (user: UserWithRoles) => void;
    onDelete: (userId: number) => void;
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

export function UserMobileCard({ user, onViewDetails, onDelete }: UserMobileCardProps) {
    const handleVerify = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(
            route('users.verify', user.id),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(user.id);
    };

    return (
        <div
            className="border-4 border-gray-300 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0" onClick={() => onViewDetails(user)}>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{user.name}</h3>
                    <p className="text-sm text-gray-600 break-all">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400 ml-3 flex-shrink-0">#{user.id}</span>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                            <span
                                key={role.id}
                                className={`text-sm font-medium px-3 py-1.5 rounded-full ${getRoleBadgeColor(role.name)}`}
                            >
                                {translateRole(role.name)}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                    {user.email_verified_at ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Email verificado</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Sin verificar</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                    {!user.email_verified_at && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={handleVerify}
                        >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Verificar
                        </Button>
                    )}
                    <Link href={route('users.edit', user.id)} className={!user.email_verified_at ? 'flex-1' : 'flex-[2]'}>
                        <Button size="sm" variant="default" className="w-full">
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                    </Button>
                </div>
            </div>
        </div>
    );
}
