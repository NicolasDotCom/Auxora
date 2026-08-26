import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string[]; // Roles permitidos para acceder a esta opción
    excludeRoles?: string[]; // Roles excluidos de acceder a esta opción
    permission?: string; // Permiso específico requerido
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: string[]; // Roles del usuario
    permissions?: string[]; // Permisos del usuario
    [key: string]: unknown; // This allows for additional properties...
}


//Tipos para el proyecto
export type Speciality = 'Impresoras' | 'Sistemas';

export interface Customer {
    id: number;
    name: string;
    email: string;
    name_user: string;
    phone: string;
    nit?: string | null;
    created_at: string;
    updated_at: string;
    tickets_count?: number;
}

export interface Support {
    id: number;
    name: string;
    email: string;
    phone: string;
    speciality: Speciality;
    created_at: string;
    updated_at: string;
    tickets_count?: number;
}

export interface Ticket {
    id:number;
    customer_id: number | null;
    cliente_externo?: string | null;
    support_id: number | null;
    subject: string;
    description: string;
    phone: string;
    nombre_contacto?: string | null;
    address: string;
    ciudad?: string | null;
    brand: string;
    model: string;
    serial: string;
    status: 'Open' | 'In Progress' | 'Closed';
    created_at: string;
    updated_at: string;
    customer: Customer | null;
    support: Support | null;
    user?: { id: number; name: string } | null;
    documents_count?: number;
}

//Para pagination
export interface PaginationLinks {
    url:string | null;
    label: string;
    active: boolean
}
export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
    links: PaginationLinks[];
}

interface Role {
    id:number;
    name: string;
    permissions_count?: number;
}

export interface Permission {
    id:number;
    name:string;
}

export interface UserWithRoles {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: {id:number, name: string}[];
    customer?: { id: number; email: string; name_user: string; nit?: string | null } | null;
}

export interface PageProps {
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    customers?: PaginatedData<Customer> | { id: number; name: string; name_user: string }[] ;
    supports?: PaginatedData<Support> | { id: number; name: string }[];
    companies?: string[];
    tickets: PaginatedData<Ticket>;
    allTickets?: Ticket[];
    search?: string;
    [key: string]: unknown;
    totalCustomers: number;
    totalTickets: number;
    totalSupports: number;
    technicalSupportSpeciality: Record<string, number>;
    ticketByStatus: Record<Ticket['status'], number>;
    //roles y permisos
    roles: PaginatedData<Role> | { id: number; name: string }[] ;
    auth?: {
        user?: User;
        roles: string[];
        permissions:string[];
    },
    users: PaginatedData<UserWithRoles> | UserWithRoles[];
    pendingPartsCount?: number;
    isCustomer?: boolean;
    isComercial?: boolean;
}
