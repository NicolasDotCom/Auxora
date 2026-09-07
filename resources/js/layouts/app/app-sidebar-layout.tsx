import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { props } = usePage<{ demo?: { enabled: boolean; banner: string } }>();
    const demoEnabled = props.demo?.enabled ?? false;
    const demoBanner = props.demo?.banner ?? '';

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                {demoEnabled && (
                    <div
                        role="alert"
                        className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{demoBanner}</span>
                    </div>
                )}
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
