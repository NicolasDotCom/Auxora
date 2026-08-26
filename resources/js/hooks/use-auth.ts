import { usePage } from '@inertiajs/react';

export function useAuth() {
    const { auth } = usePage().props as any;
    
    const user = auth?.user || null;
    const roles = auth?.roles || [];
    const permissions = auth?.permissions || [];
    
    const hasRole = (role: string) => {
        return roles.includes(role);
    };
    
    const hasAnyRole = (rolesToCheck: string[]) => {
        return rolesToCheck.some(role => roles.includes(role));
    };
    
    const hasPermission = (permission: string) => {
        return permissions.includes(permission);
    };
    
    const isAdmin = () => hasRole('admin');
    const isSupport = () => hasRole('support');
    const isCustomer = () => hasRole('customer');
    
    return {
        user,
        roles,
        permissions,
        hasRole,
        hasAnyRole,
        hasPermission,
        isAdmin,
        isSupport,
        isCustomer
    };
}
