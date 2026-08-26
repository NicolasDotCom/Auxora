import { UserWithRoles, Role } from '@/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface RoleMobileCardProps {
    user: UserWithRoles;
    currentRole: string;
    roles: Role[];
    onRoleChange: (userId: number, role: string) => void;
}

const translateRole = (roleName: string) => {
    const translations: { [key: string]: string } = {
        'admin': 'Administrador',
        'customer': 'Cliente',
        'support': 'Soporte',
        'guest': 'Invitado',
        'Coordinador': 'Coordinador',
        'comercial': 'Comercial'
    };
    return translations[roleName] || roleName;
};

const getRoleBadgeColor = (roleName: string) => {
    const colors: { [key: string]: string } = {
        'admin': 'bg-red-100 text-red-700 border-red-200',
        'customer': 'bg-blue-100 text-blue-700 border-blue-200',
        'support': 'bg-green-100 text-green-700 border-green-200',
        'comercial': 'bg-purple-100 text-purple-700 border-purple-200',
        'Coordinador': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export function RoleMobileCard({ user, currentRole, roles, onRoleChange }: RoleMobileCardProps) {
    return (
        <div className="border-4 border-gray-300 rounded-lg p-5 bg-white shadow-sm">
            <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{user.name}</h3>
                <p className="text-sm text-gray-600 break-all">{user.email}</p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                        Rol Asignado
                    </label>
                    <Select value={currentRole} onValueChange={(value) => onRoleChange(user.id, value)}>
                        <SelectTrigger className="w-full h-12">
                            <SelectValue placeholder="Seleccionar rol">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(currentRole)}`}>
                                        {translateRole(currentRole)}
                                    </span>
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name} className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(role.name)}`}>
                                            {translateRole(role.name)}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>
        </div>
    );
}
