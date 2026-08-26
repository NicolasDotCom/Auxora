import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [], label = 'Plataforma' }: { items: NavItem[]; label?: string }) {
    const page = usePage();
    const pendingPartsCount = (page.props.pendingPartsCount as number | undefined) ?? 0;
    
    return (
        <SidebarGroup className="mt-3 px-2 py-0 first:mt-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isPendientes = item.href === '/pending-parts';
                    const hasPending = isPendientes && pendingPartsCount > 0;
                    
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton  
                                asChild 
                                isActive={item.href === page.url}
                                tooltip={{ children: item.title }}
                                className={hasPending ? 'relative' : ''}
                            >
                                <Link href={item.href} prefetch>
                                    <div className="relative">
                                        {item.icon && <item.icon className={hasPending ? 'animate-pulse' : ''} />}
                                        {hasPending && (
                                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-2">
                                        {item.title}
                                        {hasPending && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                                                {pendingPartsCount}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
