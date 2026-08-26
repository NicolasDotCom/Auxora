# 04 — Sistema de Roles y Permisos

**[Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)** con sistema completamente dinámico:
- Sin hardcoding de roles
- Permisos granulares por entidad y acción
- Gestión vía CLI
- Auto-descubrimiento en frontend (sidebar dinámico)

Para información general del sistema (roles disponibles, casos de uso), ver [`../ROLES.md`](../ROLES.md) en la raíz.

## Permisos disponibles

| Entidad | Permisos |
|---------|----------|
| Ticket | `view`, `create`, `edit`, `delete`, `update status`, `reopen` |
| Customer | `view`, `create`, `edit`, `delete` |
| Support | `view`, `create`, `edit`, `delete` |
| User | `view`, `create`, `edit`, `delete` |
| Role | `view`, `create`, `edit`, `delete` |
| Analytics | `view analytics`, `stats analytics`, `export analytics` |
| API | `view api`, `manage api` |

## Triple capa de seguridad

**Capa 1: Rutas (`web.php`)**
```php
Route::middleware(['auth', 'verified'])->group(...);
Route::middleware(['auth', 'verified', 'role:admin'])->group(...);
Route::middleware(['auth', 'verified', 'role:admin|support|Coordinador'])->group(...);
Route::middleware('permission:view analytics')->group(...);
```

**Capa 2: Controladores (constructor)**
```php
public function __construct()
{
    $this->middleware('permission:view ticket')->only(['index', 'show']);
    $this->middleware('permission:create ticket')->only(['create', 'store', 'duplicate']);
    $this->middleware('permission:edit ticket')->only(['edit', 'update', 'deleteDocument']);
}
```

**Capa 3: Queries (visibilidad)**
Ver implementación detallada en [10-common-patterns.md](10-common-patterns.md).

**Capa 4: UI (Frontend, solo UX)**
Ver [06-frontend-react-inertia.md](06-frontend-react-inertia.md) → sección Hooks.

> Las capas 1+2 son las únicas confiables. La 4 es solo UX.

## Comandos Artisan

```bash
# Listar
php artisan role:list                          # Todos los roles
php artisan role:list --role=Coordinador       # Un rol específico
php artisan role:list --permissions            # Todos los permisos disponibles

# Crear (preferir comma-separados para evitar problemas con acentos)
php artisan role:create "Mi Rol"
php artisan role:create "Tecnico Junior" \
    --permissions="view ticket,edit ticket,view customer"
```

## Asignar rol / permiso

```php
// Vía código
$user->assignRole('Coordinador');
$user->syncRoles(['Coordinador', 'support']);

// Permisos directos (sin rol)
$user->givePermissionTo('view ticket');
$user->syncPermissions(['view ticket', 'create ticket']);
```

## Sidebar dinámico (frontend)

```tsx
import { usePermissions } from '@/hooks/use-permissions';

const { canAccessNavItem } = usePermissions();

const navItems = [
    {
        title: 'Tickets',
        href: '/tickets',
        permission: 'view ticket',
    },
    {
        title: 'Reportes',
        href: '/dashboard',
        roles: ['admin', 'Coordinador'],
    },
];
```

**Helper `canAccessNavItem`**:
```ts
canAccessNavItem(item: {
    roles?: string[];
    excludeRoles?: string[];
    permission?: string;
}): boolean
```

Lógica:
1. Sin `roles`, `excludeRoles`, `permission` → ocultar.
2. Si tiene `permission`, validar contra `userPermissions`.
3. Si tiene `roles`, validar contra `userRoles`.
4. `roles: ['*']` permite a todos los autenticados.
5. `excludeRoles` deniega si el usuario tiene alguno de esos.

## Agregar nuevo permiso

**Paso 1**: agregar al seeder
```php
// database/seeders/RolesAndPermissionsSeeder.php
$entitiesPermissions = [
    'invoice' => ['view', 'create', 'edit', 'delete'],  // Nuevo
];
```

**Paso 2**: aplicar al controlador
```php
$this->middleware('permission:view invoice')->only(['index', 'show']);
$this->middleware('permission:create invoice')->only(['create', 'store']);
```

**Paso 3**: agregar al sidebar
```tsx
{
    title: 'Facturas',
    href: '/invoices',
    permission: 'view invoice',
}
```

**Paso 4**: ejecutar seeder
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

## Permisos críticos

| Permiso | Quién debería tenerlo |
|---------|----------------------|
| `delete user` | Solo admin |
| `delete role` | Solo admin |
| `delete ticket` | Solo admin |
| `manage api` | Solo admin |
| `view analytics` | admin, Coordinador |
| `export analytics` | admin, Coordinador |

## Errores comunes

❌ Validar permisos solo en frontend (UX sin seguridad)  
❌ Usar `$user->can('view ticket')` (Laravel Gate) — usar `$user->hasPermissionTo('view ticket')` (Spatie)  
❌ Olvidar `forgetCachedPermissions()` después de seeders en runtime  
❌ Crear permisos con espacios dobles o caracteres especiales (rompe Spatie)

✅ Usar middleware en rutas y constructores  
✅ Limpiar caché de permisos tras cambios:
```php
app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
```
