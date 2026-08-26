# 06 — Frontend: React + Inertia + TypeScript

## Stack

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19 | UI library |
| TypeScript | 5.7 | Tipado estático |
| Inertia.js | 2.0 | Bridge SPA |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Estilos utility-first |
| Radix UI | Latest | Componentes headless accesibles |
| TanStack Table | 8 | Tablas avanzadas |
| Recharts | 2 | Gráficos |
| Lucide React | Latest | Iconos |
| Sonner | 2 | Notificaciones toast |
| Ziggy | 2 | Rutas Laravel en JS |

## Estructura

```
resources/js/
├── app.tsx                      # Entry point React
├── ssr.tsx                      # Server-side rendering
├── components/
│   ├── ui/                      # Primitivos (button, dialog, table)
│   ├── app-*.tsx                # Layout app (sidebar, header)
│   ├── ticket-*.tsx             # Específicos de dominio
│   ├── user-*.tsx
│   ├── customer-*.tsx
│   └── support-*.tsx
├── pages/                       # 1 archivo por ruta lógica
│   ├── auth/
│   ├── Tickets/                 # Index, Create, Edit, Show
│   ├── Customers/
│   ├── Supports/
│   ├── Users/
│   ├── Roles/
│   ├── PendingParts/
│   ├── Analytics/
│   ├── Tokens/
│   ├── User/
│   ├── settings/
│   ├── DashboardNew.tsx
│   └── ExportTickets.tsx
├── layouts/                     # app/, auth/, settings/
├── hooks/                       # use-permissions, use-auth, use-appearance, use-flash, use-mobile
├── types/                       # Tipos compartidos
├── lib/utils.ts                 # cn() helper
└── constants/                   # specialities, etc.
```

## Convención de páginas

Cada página Inertia se ubica en `resources/js/pages/` siguiendo el patrón:

```
pages/
├── Tickets/
│   ├── Index.tsx        # /tickets
│   ├── Create.tsx       # /tickets/create
│   ├── Edit.tsx         # /tickets/{id}/edit
│   └── Show.tsx         # /tickets/{id}
```

Cada archivo exporta un componente default que el sistema Inertia resuelve.

## Patrón de página típica

```tsx
// resources/js/pages/Tickets/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { type Ticket, type Paginated } from '@/types';

interface PageProps {
    tickets: Paginated<Ticket>;
    filters: { status?: string; date_from?: string };
}

export default function TicketsIndex({ tickets, filters }: PageProps) {
    const { hasPermission } = usePermissions();

    return (
        <AppLayout>
            <Head title="Tickets" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tickets</h1>
                {hasPermission('create ticket') && (
                    <Button asChild>
                        <Link href={route('tickets.create')}>+ Nuevo Ticket</Link>
                    </Button>
                )}
            </div>

            {/* Filtros · Tabla · Paginación */}
        </AppLayout>
    );
}
```

## Comunicación con Backend

### Props desde Laravel

```php
// Controller
return Inertia::render('Tickets/Index', [
    'tickets' => $tickets,
    'filters' => $filters,
    'customers' => $customers,
]);
```

```tsx
// Componente
interface PageProps {
    tickets: Paginated<Ticket>;
    filters: Record<string, string>;
    customers: Customer[];
}
```

### Datos del usuario

```tsx
import { usePage } from '@inertiajs/react';
import { type PageProps } from '@/types';

function MyComponent() {
    const { auth } = usePage<PageProps>().props;
    // auth.user, auth.roles, auth.permissions
}
```

### Formularios con `useForm`

```tsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, put, patch, processing, errors, reset } = useForm({
    subject: '',
    description: '',
});

const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tickets.store'), {
        onSuccess: () => { toast.success('Creado'); reset(); },
        onError: () => toast.error('Error de validación'),
    });
};
```

### Navegación

```tsx
import { Link, router } from '@inertiajs/react';

// Link declarativo (SPA, sin recarga)
<Link href={route('tickets.show', ticket.id)}>Ver</Link>

// Navegación programática
router.visit(route('tickets.index'));
router.get(route('tickets.show', id));
router.post(route('tickets.store'), data);
router.delete(route('tickets.destroy', id));
```

## Sistema de UI

Primitivos en `components/ui/` encapsulan Radix UI + Tailwind. **Usar siempre estos** en lugar de HTML crudo.

| Componente | Uso |
|------------|-----|
| `<Button>` | Variantes: default, destructive, outline, ghost |
| `<Input>` / `<Textarea>` | Campos de texto |
| `<Select>` | Dropdown accesible |
| `<Dialog>` / `<Sheet>` | Modales |
| `<DropdownMenu>` | Menús contextuales |
| `<Table>` | Tablas |
| `<Badge>` | Etiquetas de estado |
| `<Card>` | Contenedores |
| `<Tabs>` | Pestañas |
| `<Tooltip>` | Info al pasar mouse |
| `<Popover>` | Contenido flotante |
| `<Alert>` / `<AlertDialog>` | Alertas y confirmaciones |
| `<Combobox>` | Búsqueda + selección |

## Hooks esenciales

```tsx
// Permisos y roles
const {
    hasPermission,        // (perm: string) => boolean
    hasRole,              // (role: string) => boolean
    hasAnyRole,           // (roles: string[]) => boolean
    canAccessNavItem,     // (item: NavItem) => boolean
    userRoles,
    userPermissions,
} = usePermissions();

// Auth
const { user, isAuthenticated } = useAuth();

// Tema
const { appearance, updateAppearance } = useAppearance();
// appearance: 'light' | 'dark' | 'system'

// Flash messages
const flash = useFlash();
// flash.success, flash.error, flash.warning, flash.info
```

## Rutas en TypeScript (Ziggy)

```tsx
// ✅ Correcto
<Link href={route('tickets.show', ticket.id)}>Ver</Link>
router.visit(route('tickets.index'));

// ❌ Incorrecto (hardcoded)
<Link href={`/tickets/${ticket.id}`}>Ver</Link>

// ❌ Incorrecto (recarga la página)
window.location.href = route('tickets.index');
```

Regenerar tipos de rutas tras cambiar `web.php`:
```bash
php artisan ziggy:generate
```

## Notificaciones (Sonner)

```tsx
import { toast } from 'sonner';

toast.success('Ticket creado');
toast.error('No se pudo eliminar');
toast.warning('Tienes cambios sin guardar');
toast.info('Nueva versión disponible');

// Loading + promise
toast.promise(saveTicket(), {
    loading: 'Guardando...',
    success: 'Guardado',
    error: 'Error al guardar',
});
```

## Tema oscuro/claro

3 modos: `light`, `dark`, `system`. Tailwind 4 con `@theme` configura variables CSS automáticamente.

```tsx
import { useAppearance } from '@/hooks/use-appearance';

const { appearance, updateAppearance } = useAppearance();
<button onClick={() => updateAppearance('dark')}>Modo Oscuro</button>
```

## Responsive Design

Estrategia **mobile-first**:
- default → móvil
- `md:` → tablet
- `lg:` → desktop
- `xl:` → pantallas grandes

```tsx
<div className="flex flex-col md:flex-row gap-2 md:gap-4">
```

## Errores comunes

❌ `<a href>` para navegación interna (usar `<Link>`)  
❌ `fetch()` a rutas Laravel (usar `useForm` o `router.*`)  
❌ Hardcodear rutas — usar `route()`  
❌ Omitir tipos TypeScript (evitar `any`)  
❌ `useState` para formularios grandes — usar `useForm`  
❌ Mostrar/ocultar UI solo por UX — la seguridad está en backend

✅ Usar `<Head title="..." />`  
✅ Envolver páginas en `<AppLayout>`  
✅ Agregar `key` en listas  
✅ Usar `cn()` para combinar clases condicionalmente
