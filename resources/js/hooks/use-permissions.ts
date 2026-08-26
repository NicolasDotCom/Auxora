import { usePage } from '@inertiajs/react';

interface AuthData {
    user: any;
    roles: string[];
    permissions: string[];
}

interface PagePropsWithAuth {
    auth: AuthData;
    [key: string]: any;
}

export function usePermissions() {
    const page = usePage();
    const auth = (page.props as any).auth as AuthData;

    const hasPermission = (permission: string): boolean => {
        if (!auth.permissions) return false;
        return auth.permissions.includes(permission);
    };

    const hasRole = (role: string): boolean => {
        if (!auth.roles) return false;
        return auth.roles.includes(role);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!auth.roles) return false;
        return roles.some(role => auth.roles.includes(role));
    };

    const canAccessNavItem = (item: { roles?: string[]; excludeRoles?: string[]; permission?: string }): boolean => {
        // Si no hay usuario autenticado, no puede acceder
        if (!auth.user) return false;

        // Si el item especifica roles excluidos, verificar que el usuario no los tenga
        if (item.excludeRoles && item.excludeRoles.length > 0) {
            const hasExcludedRole = item.excludeRoles.some(role => auth.roles.includes(role));
            if (hasExcludedRole) return false;
        }

        // Si el item especifica roles como ['*'], todos los usuarios autenticados pueden acceder
        if (item.roles && item.roles.includes('*')) return true;

        // Si el item requiere un permiso específico
        if (item.permission) {
            return hasPermission(item.permission);
        }

        // Si el item especifica roles específicos
        if (item.roles && item.roles.length > 0) {
            return hasAnyRole(item.roles);
        }

        // Si solo tiene excludeRoles (sin roles ni permission), permitir acceso si no está excluido
        if (item.excludeRoles && item.excludeRoles.length > 0) {
            return true;
        }

        // Por defecto, denegar acceso
        return false;
    };

    return {
        hasPermission,
        hasRole,
        hasAnyRole,
        canAccessNavItem,
        userRoles: auth.roles || [],
        userPermissions: auth.permissions || []
    };
}
