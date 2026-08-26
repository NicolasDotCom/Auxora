# 02 — Arquitectura Técnica

## Visión

**Monolito modular** sobre Laravel 12 con frontend SPA vía Inertia.js (sin API REST tradicional). Complementado con API REST + Sanctum para integraciones externas.

```
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND (React 19 + TS)                     │
│  Pages ─► Components ─► Hooks ─► UI Lib (Radix + Tailwind)    │
└───────────────────────┬──────────────────────────────────────┘
                        │ Inertia.js v2 (SPA bridge)
┌───────────────────────┼──────────────────────────────────────┐
│                       ▼            BACKEND (Laravel 12)      │
│  Routes (web.php, api.php)                                    │
│       │                                                       │
│  Middleware: auth, verified, role:X, permission:Y            │
│       │                                                       │
│  Controllers (thin) ──► Form Requests (validación)           │
│       │                                                       │
│  Services / Helpers (lógica de negocio)                      │
│       │                                                       │
│  Models (Eloquent ORM) ──► MySQL                              │
│                                                                │
│  Storage (Local/S3) · Cache (Redis) · Mail (Resend/SMTP)     │
└────────────────────────────────────────────────────────────────┘
```

## Patrones aplicados

**1. MVC + Service Layer**
```
Controller (HTTP) ──► Service (lógica) ──► Model (datos)
         │                    │
         └─ Form Request      └─ CacheService
            (validación)        (caché centralizado)
```
Regla: controllers delgados. Si el método tiene >30 líneas, extraer a Service.

**2. Cache-Aside centralizado**
Toda la lógica de caché vive en `App\Services\CacheService`. Detalle en [07-caching-strategy.md](07-caching-strategy.md).

**3. Strategy para visibilidad por rol**
Filtros en queries según rol del usuario. Implementación detallada en [10-common-patterns.md](10-common-patterns.md).

**4. Observer / Audit Trail**
`TicketHistory` registra cada cambio importante del ticket.

**5. Single Source of Truth para Auth**
Info de usuario/permisos se comparte vía `HandleInertiaRequests::share()`:
```php
'auth' => [
    'user' => $request->user(),
    'roles' => $request->user()?->getRoleNames(),
    'permissions' => $request->user()?->getAllPermissions()->pluck('name'),
]
```

## Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Presentación | `resources/js/` | React 19, páginas, componentes, hooks |
| Routing | `routes/` | web.php, api.php, auth.php, settings.php |
| Middleware | `app/Http/Middleware/` | auth, verified, permisos, Inertia |
| Controladores | `app/Http/Controllers/` | HTTP, delgados |
| Servicios | `app/Services/` | Lógica de negocio compartida |
| Helpers | `app/Helpers/` | Funciones estáticas (fechas) |
| Modelos | `app/Models/` | Eloquent ORM |

## Seguridad por capas

```
Capa 1: HTTP (Rutas)
  Route::middleware(['auth', 'verified', 'role:admin'])->group(...);

Capa 2: Controlador (Constructor)
  $this->middleware('permission:view ticket')->only(['index', 'show']);

Capa 3: Query (Visibilidad)
  if ($user->hasRole('support')) $query->where('support_id', $support->id);

Capa 4: UI (Frontend, solo UX)
  {hasPermission('edit ticket') && <EditButton />}
```

> Las capas 1+2 son las únicas confiables. La capa 4 es solo UX.

## Performance

| Optimización | Dónde |
|--------------|-------|
| Eager loading | Siempre `with()` en relaciones |
| Select específico | `select('id', 'campo1', ...)` en lugar de `*` |
| withCount | Para contadores sin cargar relaciones |
| Índices BD | 49 índices en migraciones de optimización |
| Caché centralizada | TTL 1h catálogos, 24h festivos, 5min stats |
| Paginación | `paginate(10)` por defecto, máximo 50 |
| Invalidación | `CacheService::clearXxxCache()` al mutar |

## Comunicación Frontend ↔ Backend

**Flujo normal (vía Inertia):**
```
React (useForm) → POST /tickets → Laravel Controller
   ↓ Valida (FormRequest) → Ejecuta lógica → Retorna Inertia::render
   ↓
React recibe props vía Inertia → Renderiza página
```

**Flujo API (vía Sanctum):**
```
Cliente externo → POST /api/tickets
   Header: Authorization: Bearer {token}
   ↓
Laravel (route api.php) → Sanctum middleware → Controller API
   ↓ Retorna JSON
```

## Decisiones arquitectónicas (ADRs)

| ADR | Decisión | Consecuencia |
|-----|----------|--------------|
| 001 | Inertia.js v2 + React | DX simplificado, validación server-side reusada |
| 002 | Spatie Permission sobre Gate | Comandos `role:*`, middleware `permission:X` |
| 003 | CacheService centralizado | Una sola fuente de verdad, fácil invalidación |
| 004 | WorkingDaysHelper para SLA | Cálculo preciso con tabla `holidays` |
| 005 | Multi-driver Storage (local + S3) | Mismo código, distinto backend |
| 006 | TypeScript estricto en frontend | Validación en build |

## Pipeline de deploy

```
Developer → git push origin main
   ↓
Coolify (webhook) recibe push
   ↓
Coolify construye imagen Docker:
   ├── composer install --no-dev --optimize-autoloader
   ├── corepack enable
   ├── pnpm install --frozen-lockfile && pnpm run build
   ↓
Post-deploy hooks dentro del contenedor:
   ├── config:cache + route:cache + view:cache
   ├── migrate --force
   ↓
Traefik hace swap zero-downtime
   ↓
Production: App ↔ MySQL · Cache + Sessions + Queues ↔ Redis · Files ↔ MinIO/S3
```

Detalle completo en [12-deployment-coolify-vps.md](12-deployment-coolify-vps.md) y [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

## Testabilidad

- Tests Feature: end-to-end de flujos (Pest)
- Tests Unit: lógica pura (Helpers)
- Factories: para todos los modelos
- `RefreshDatabase`: en cada test

Detalle en [09-testing.md](09-testing.md).
