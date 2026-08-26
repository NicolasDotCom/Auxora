import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, BriefcaseMedical, ClipboardList, Folder, LayoutGrid, Users, FileDown, Package, TrendingUp, PieChart, KeyRound, PlugZap } from 'lucide-react';
import AppLogo from './app-logo';
import { usePermissions } from '@/hooks/use-permissions';


// Items de la sección Plataforma
const allPlatformNavItems: NavItem[] = [
    {
        title: 'Panel de Control',
        href: '/dashboard',
        icon: LayoutGrid,
        roles: ['*'],
    },
    {
        title: 'Clientes',
        href: '/customers',
        icon: Users,
        permission: 'view customer',
    },
    {
        title: 'Soporte Técnico',
        href: '/supports',
        icon: BriefcaseMedical,
        permission: 'view support',
    },
    {
        title: 'Tickets',
        href: '/tickets',
        icon: ClipboardList,
        permission: 'view ticket',
    },
    {
        title: 'Pendientes',
        href: '/pending-parts',
        icon: Package,
        excludeRoles: ['customer', 'Comercial'],
    },
];

// Items de la sección Análisis
const allAnalyticsNavItems: NavItem[] = [
    {
        title: 'Exportar Tickets',
        href: '/export-tickets',
        icon: FileDown,
        permission: 'export analytics',
    },
    {
        title: 'Rendimiento Técnico',
        href: '/analytics/technicians',
        icon: TrendingUp,
        permission: 'view analytics',
    },
    {
        title: 'Estadística Tickets',
        href: '/analytics/tickets',
        icon: PieChart,
        permission: 'stats analytics',
    },
];

const allApiNavItems: NavItem[] = [
    {
        title: 'Demo API Tickets',
        href: '/api-demo/tickets',
        icon: PlugZap,
        permission: 'view api',
    },
    {
        title: 'API Tokens',
        href: '/settings/api-tokens',
        icon: KeyRound,
        permission: 'manage api',
    },
];

const allFooterNavItems: NavItem[] = [
    {
        title: 'Roles',
        href: '/roles',
        icon: Folder,
        roles: ['admin'], // Solo admin puede gestionar roles
    },
    {
        title: 'Usuarios',
        href: '/users',
        icon: BookOpen,
        roles: ['admin'], // Solo admin puede gestionar usuarios
    },
];

export function AppSidebar() {
    const { canAccessNavItem } = usePermissions();

    const platformNavItems = allPlatformNavItems.filter(item => canAccessNavItem(item));
    const analyticsNavItems = allAnalyticsNavItems.filter(item => canAccessNavItem(item));
    const apiNavItems = allApiNavItems.filter(item => canAccessNavItem(item));
    const footerNavItems = allFooterNavItems.filter(item => canAccessNavItem(item));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={platformNavItems} label="Plataforma" />
                {analyticsNavItems.length > 0 && (
                    <NavMain items={analyticsNavItems} label="Analisis" />
                )}
                {apiNavItems.length > 0 && (
                    <NavMain items={apiNavItems} label="API" />
                )}
            </SidebarContent>

            <SidebarFooter className="pt-4">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
