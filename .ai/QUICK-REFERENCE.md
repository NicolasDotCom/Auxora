# ⚡ Quick Reference — Sistema de Tickets

> Resumen ejecutivo del proyecto. **Lee esto primero** antes de generar código, luego consulta los archivos específicos.

---

## 🎟️ ¿Qué es?

Sistema de gestión de tickets de soporte técnico en **Laravel 13 + Inertia.js 3 + React 19 + TypeScript**.

Desplegado en un **VPS propio orquestado con [Coolify](https://coolify.io/)** con:
- **MySQL 8** (servicio gestionado por Coolify)
- **Redis 7** (servicio gestionado por Coolify, cache + sessions + queues)
- **MinIO** o **S3 externo** (storage persistente)

---

## 🏗️ Stack en 30 segundos

```
Backend:    Laravel 13 · PHP 8.3+ · MySQL · Spatie Permission · Sanctum
Frontend:   React 19 · TypeScript 5.7 · Inertia.js v3 · Vite 6 · Tailwind 4
UI:         Radix UI · TanStack Table · Recharts · Lucide · Sonner
Servicios:  CacheService (central) · WorkingDaysHelper · DomPDF · Maatwebsite Excel
Infra:      VPS + Coolify · Traefik · Docker
Testing:    Pest 4 · PHPUnit 11 · Mockery
```

---

## 🌐 Infraestructura (VPS + Coolify)

```
┌─────────────────────────────────────────────────────────────┐
│                       VPS (Docker)                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│  │  MySQL 8 │    │ Redis 7  │    │  MinIO   │                │
│  │  (Coolify)│   │ (Coolify)│   │ (Coolify)│                │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                │
│       │               │              │                      │
│       ▼               ▼              ▼                      │
│  ┌────────────────────────────────────────────┐             │
│  │  App (Docker, auto-deploy desde Git)        │             │
│  │  • Cache: Redis                             │             │
│  │  • Sessions: Redis                          │             │
│  │  • Queues: Redis                            │             │
│  │  • Storage: MinIO (S3 compatible)           │             │
│  │  • DB Pool: min 5 / max 100                 │             │
│  └────────────────────────────────────────────┘             │
│                          │                                  │
│                          ▼                                  │
│                  ┌──────────────┐                           │
│                  │   Traefik    │ TLS + Let's Encrypt       │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

📚 Detalles en `12-deployment-coolify-vps.md` y `13-storage-s3-coolify.md`.

---

## 📐 Arquitectura en 30 segundos

```
Routes (web.php) ──► Middleware (auth, role, permission)
     │
     ▼
Controllers (THIN) ──► Form Requests (validación)
     │
     ▼
Services / Helpers (lógica de negocio)
  • CacheService  ←  ⭐ SIEMPRE centralizar caché aquí
  • WorkingDaysHelper  ←  ⭐ Para días/horas laborables
     │
     ▼
Models (Eloquent) ──► MySQL (índices + eager loading)
                  ──► S3 (archivos)
```

---

## 🔐 Reglas de Oro (NUNCA romper)

1. **Toda ruta nueva** lleva middleware de permiso.
2. **Toda validación** va en FormRequest.
3. **Toda query** usa eager loading (`with()`) + `select()`.
4. **Toda caché** va por `CacheService` (no `Cache::remember` directo).
5. **Toda mutación** invalida la caché correspondiente.
6. **Toda subida de archivo** va a S3 (no `storage_path()`).
7. **Toda descarga** usa `Storage::disk(config('filesystems.default'))`.
8. **Controllers delgados**: si >30 líneas, extraer a Service.
9. **TypeScript estricto**: nunca `any` sin justificación.
10. **Roles en BD** (Spatie), nunca hardcoded en código.

---

## 👤 Roles y Visibilidad

| Rol | Ve | Permisos típicos |
|-----|----|--------------------|
| **admin** | Todo | Todos |
| **Coordinador** | Todo (no eliminar) | view/create/edit ticket, view customer/support |
| **support** | Solo tickets asignados a él | view/edit ticket, update status |
| **customer** | Solo tickets donde customer_id = su customer | view/create ticket |
| **Comercial** | Solo tickets donde user_id = él | view/create ticket |

```php
// Patrón de visibilidad en query
if ($user->hasRole('support')) {
    $query->where('support_id', $support->id);
} elseif ($user->hasRole('customer')) {
    $query->where('customer_id', $customer->id);
} elseif ($user->hasRole('Comercial')) {
    $query->where('user_id', $userId);
}
// admin, Coordinador: sin filtro
```

---

## 🛠️ Patrones Esenciales (copia-pega)

### Controller delgado

```php
public function __construct()
{
    $this->middleware('permission:view ticket')->only(['index', 'show']);
    $this->middleware('permission:create ticket')->only(['create', 'store']);
}

public function index(Request $request)
{
    $query = Ticket::select('id', 'subject', 'status')
        ->with(['customer:id,name', 'support:id,name'])
        ->withCount('documents');

    // Visibilidad por rol
    $this->applyVisibility($query);

    // Filtros
    if ($request->filled('status')) $query->where('status', $request->status);

    return Inertia::render('Tickets/Index', [
        'tickets' => $query->latest()->paginate(10),
        'filters' => $request->only(['status']),
    ]);
}
```

### Form Request

```php
class StoreXxxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create xxx');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'email' => ['nullable', 'email', 'unique:xxxs,email'],
        ];
    }
}
```

### Subir archivo a S3

```php
public function uploadDocument(Request $request, Ticket $ticket)
{
    $request->validate(['document' => ['required', 'file', 'max:10240']]);

    $file = $request->file('document');
    $path = $file->storeAs(
        "ticket-documents/{$ticket->id}",
        Str::uuid() . '-' . $file->getClientOriginalName(),
        config('filesystems.default')  // S3 en prod, local en dev
    );

    $ticket->documents()->create([
        'file_name' => $file->getClientOriginalName(),
        'file_path' => $path,
        'file_type' => $file->getMimeType(),
        'file_size' => $file->getSize(),
        'uploaded_by' => auth()->id(),
    ]);

    return back()->with('success', 'Documento subido');
}
```

### Crear con auditoría + transacción + caché

```php
public function store(StoreXxxRequest $request)
{
    $xxx = DB::transaction(function () use ($request) {
        $item = Xxx::create($request->validated());

        $item->histories()->create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'description' => 'Xxx creado',
        ]);

        return $item;
    });

    CacheService::clearXxxCache();

    return redirect()->route('xxxs.index')
        ->with('success', 'Xxx creado');
}
```

### Caché en CacheService

```php
// app/Services/CacheService.php
const DEFAULT_TTL = 900;    // 15 min
const LONG_TTL    = 86400;  // 24 h
const STATS_TTL   = 300;    // 5 min

public static function getXxxList()
{
    return Cache::remember('xxx_list', self::DEFAULT_TTL, fn() =>
        Xxx::select('id', 'name')->orderBy('name')->get()
    );
}

public static function clearXxxCache()
{
    Cache::forget('xxx_list');
}
```

### React con permisos + Inertia

```tsx
import { useForm } from '@inertiajs/react';
import { usePermissions } from '@/hooks/use-permissions';

const { hasPermission } = usePermissions();
const { data, setData, post, processing, errors } = useForm({ name: '' });

const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('xxxs.store'));
};

return (
    <AppLayout>
        <Head title="Xxx" />

        {hasPermission('create xxx') && (
            <Button asChild><Link href={route('xxxs.create')}>Nuevo</Link></Button>
        )}

        <form onSubmit={submit}>
            <Input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
            />
            <Button type="submit" disabled={processing}>Guardar</Button>
        </form>
    </AppLayout>
);
```

---

## 🗺️ Mapa de Archivos Clave

| Necesito... | Archivo |
|-------------|---------|
| Agregar ruta | `routes/web.php` |
| Lógica de endpoint | `app/Http/Controllers/*` |
| Validación | `app/Http/Requests/*` |
| Lógica reutilizable | `app/Services/CacheService.php` o crear nuevo `app/Services/*Service.php` |
| Lógica de fechas hábiles | `app/Helpers/WorkingDaysHelper.php` |
| Permisos por rol | `database/seeders/RolesAndPermissionsSeeder.php` |
| Página React | `resources/js/pages/[Entidad]/[Index|Create|Edit|Show].tsx` |
| Componente UI reusable | `resources/js/components/ui/` o `resources/js/components/` |
| Sidebar nav item | `resources/js/components/app-sidebar.tsx` |
| Hook de permisos | `resources/js/hooks/use-permissions.ts` |
| Tests | `tests/Feature/[Recurso]Test.php` |
| Migración | `database/migrations/` (con timestamp nuevo) |
| Model | `app/Models/` |
| Factory | `database/factories/` |
| Configuración de storage | `config/filesystems.php` (disco `s3`) |
| **Setup de Coolify / VPS** | **`12-deployment-coolify-vps.md`** |
| **Configuración S3** | **`13-storage-s3-bucket.md`** |
| Export Excel | `app/Exports/` + `Maatwebsite` |
| Export PDF | `resources/views/exports/*.blade.php` + DomPDF |

---

## 🔑 Comandos Útiles

```bash
# Roles
php artisan role:list                          # Ver todos los roles
php artisan role:list --role=Coordinador       # Ver un rol
php artisan role:list --permissions            # Ver todos los permisos
php artisan role:create "Mi Rol" --permissions="view ticket"

# Base de datos
php artisan migrate                            # Aplicar migraciones
php artisan migrate:fresh --seed               # Reset + seed
php artisan db:seed --class=RolesAndPermissionsSeeder

# Caché (Redis en producción)
php artisan cache:clear
php artisan optimize                           # Cachear config + routes
php artisan optimize:clear
php artisan cache:warmup                       # Pre-cargar catálogos (post-deploy)
php artisan health:check                       # Verificar salud del sistema

# S3 (Storage)
php artisan files:migrate-to-s3 --dry-run      # Simular migración local→S3
php artisan files:migrate-to-s3                # Ejecutar migración
php artisan documents:backup                   # Backup de documentos en S3

# Rutas
php artisan route:list                         # Listar rutas
php artisan route:list --name=tickets          # Filtrar

# Queue (Redis)
php artisan queue:work                         # Worker local
php artisan queue:failed                       # Ver jobs fallidos
php artisan queue:retry all                    # Reintentar todos

# Frontend
pnpm dev                                       # Modo desarrollo
pnpm run build                                 # Build producción
pnpm run lint                                  # ESLint
pnpm run types                                 # TypeScript check
pnpm run format                                # Prettier

# Testing
php artisan test                               # Todos
php artisan test --filter=TicketAuth            # Filtrar
php artisan test --coverage                    # Cobertura
./vendor/bin/pest --filter=Customer            # Alternativa

# Diagnóstico en Coolify (vía Terminal del contenedor o SSH al VPS)
php artisan tinker
> Redis::ping()                                 # "PONG" = OK
> Storage::disk('s3')->url('test.txt')          # Verificar S3
```

---

## ⚠️ Errores Más Comunes (evítalos)

| ❌ NO | ✅ SÍ |
|------|------|
| Validar en controlador | Form Request |
| `Ticket::all()` | `Ticket::select(...)->paginate(10)` |
| `foreach + $t->customer->name` | `Ticket::with('customer')->get()` |
| `Cache::remember('key', ...)` directo | `CacheService::getXxxList()` |
| Olvidar `clearXxxCache()` al mutar | Siempre invalidar |
| `Storage::disk('local')` en producción | `Storage::disk(config('filesystems.default'))` |
| `storage_path('app/public/...')` | `Storage::put($path, $content)` |
| `<a href="/x">` | `<Link href={route('x')}>` |
| `fetch('/api/...')` desde React | `router.*` o `useForm` |
| `any` sin justificación | Tipos explícitos |
| Hardcodear rol en if | `$user->hasRole('admin')` |
| Olvidar middleware de permiso | Siempre en constructor/ruta |
| Editar migraciones ejecutadas | Crear nueva migración |
| Lógica de negocio en Controller | Service o Model |
| Catch vacío | Log + Rethrow / mensaje user |
| `FILESYSTEM_DISK=local` en prod | `FILESYSTEM_DISK=s3` |

---

## 📊 Métricas de Performance

- **Eager loading**: usar `with()` en TODAS las queries con relaciones.
- **Select específico**: nunca `*`, solo columnas necesarias.
- **withCount**: para relaciones contables.
- **Paginación**: `paginate(10)` por defecto.
- **Caché Redis**: TTL 5-15 min para catálogos, 5 min para stats.
- **Índices MySQL**: en columnas de búsqueda y FK.
- **Connection pooling**: min 5, max 100 conexiones.
- **S3**: archivos fuera del servidor (no afectan deploy).

### Targets en Producción

| Métrica | Target |
|---------|--------|
| Response time | < 300 ms |
| Caché hit rate | > 80% |
| Concurrent users | 50+ |
| DB queries/request | < 5 |

---

## 🎯 Antes de hacer commit, verifica:

- [ ] Validación en FormRequest
- [ ] Middleware de permisos aplicado
- [ ] Eager loading en queries
- [ ] Select específico
- [ ] Paginación si es listado
- [ ] Caché invalidada si muté datos
- [ ] Storage usa el disco configurado (`config('filesystems.default')`)
- [ ] TypeScript sin `any`
- [ ] Tests añadidos/actualizados
- [ ] Lint y tipos pasan (`pnpm run lint && pnpm run types`)
- [ ] Mensaje de commit en conventional format

---

## 🚀 Antes de deploy a Coolify / VPS, verifica:

- [ ] `.env` de producción tiene `FILESYSTEM_DISK=s3`
- [ ] `.env` de producción tiene `CACHE_STORE=redis`
- [ ] `.env` de producción tiene `SESSION_DRIVER=redis`
- [ ] `.env` de producción tiene `QUEUE_CONNECTION=redis`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` apunta al dominio del VPS (ej. `https://auxora.homelabvps.dev`)
- [ ] Migraciones compatibles con MySQL
- [ ] `pnpm run build` ejecutado y commiteado

Post-deploy:
- [ ] `php artisan migrate --force` se ejecutó OK
- [ ] `php artisan cache:warmup` ejecutado
- [ ] `php artisan health:check` retorna ✅
- [ ] Queue worker activo (`php artisan queue:work`)
- [ ] Subir y descargar archivo de prueba funciona

---

**¿Necesitas más detalle?** Consulta el archivo correspondiente:

| Si trabajas en... | Lee |
|-------------------|-----|
| Entender el dominio | `01-project-overview.md` |
| Decisiones de arquitectura | `02-architecture.md` |
| Modelo nuevo / relaciones | `03-models-and-relationships.md` |
| Roles / permisos | `04-roles-and-permissions.md` |
| Estilo de código | `05-coding-standards.md` |
| React / Inertia | `06-frontend-react-inertia.md` |
| Caché (Redis) | `07-caching-strategy.md` |
| Rutas / Controllers | `08-routes-and-controllers.md` |
| Tests | `09-testing.md` |
| Patrones recurrentes | `10-common-patterns.md` |
| Buenas prácticas | `11-dos-and-donts.md` |
| **Despliegue Coolify / VPS** | **`12-deployment-coolify-vps.md`** |
| **Storage S3** | **`13-storage-s3-bucket.md`** |
| Ejemplos completos | `EXAMPLES.md` |

---

**Versión**: 1.1  
**Hosting**: VPS propio orquestado con Coolify  
**Stack**: MySQL + Redis + S3 (todo managed)  
**Última actualización**: Enero 2026
