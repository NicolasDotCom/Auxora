# 07 — Estrategia de Caché

Patrón **Cache-Aside centralizado** en `App\Services\CacheService`. Una sola fuente de verdad para toda la lógica de caché.

## Backend según entorno

| Entorno | Driver | Notas |
|---------|--------|-------|
| Local (Laragon) | `file` o `redis` | Redis viene con Laragon |
| Producción (Laravel Cloud) | `redis` (managed) | Compartido entre workers |

## TTLs

```php
const DEFAULT_TTL = 3600;    // 1 hora — catálogos (clientes, técnicos)
const LONG_TTL    = 86400;   // 24 horas — festivos
const STATS_TTL   = 300;     // 5 minutos — estadísticas dashboard
```

| Tipo | TTL | Datos |
|------|-----|-------|
| Catálogos | 1 hora | Cambian poco, se consultan mucho |
| Festivos | 24 horas | Casi nunca cambian en un año |
| Estadísticas dashboard | 5 min | Queries pesadas, tolerancia a desfase |
| Stats en middleware | 1-5 min | Según `app.debug` |

## CacheService — API

Ubicación: `app/Services/CacheService.php`

```php
// Catálogos (1h)
CacheService::getCustomersList();
CacheService::getSupportsList();
CacheService::getCompanyNames();

// Festivos (24h)
CacheService::getHolidays(2026);  // Año; default: actual

// Estadísticas (5min)
CacheService::getDashboardStats($userId, $callback);
CacheService::getTechnicianRankingStats($cacheKey, $callback);

// Invalidación
CacheService::clearCustomersCache();
CacheService::clearSupportsCache();
CacheService::clearHolidaysCache();
CacheService::clearAll();
```

## Claves de caché

```
# Catálogos (estáticas)
customers_list
supports_list
company_names

# Festivos (por año)
holidays_2025
holidays_2026
holidays_2027

# Estadísticas (dinámicas)
stats:total_customers
stats:total_tickets
stats:total_supports
stats:pending_parts_count
stats:support_speciality
stats:ticket_by_status
dashboard_stats_{userId}
technician_ranking_{hash}
```

> En Laravel Cloud Redis, las claves tienen prefijo (`CACHE_PREFIX=auxora_`) para evitar colisiones.

## Patrones de uso

### 1. Lectura con caché automática

```php
use App\Services\CacheService;

$customers = CacheService::getCustomersList();
foreach ($customers as $customer) {
    echo $customer->name;
}
```

### 2. Invalidación al mutar

```php
public function store(StoreCustomerRequest $request)
{
    $customer = Customer::create($request->validated());
    CacheService::clearCustomersCache();

    return redirect()->route('customers.index')
        ->with('success', 'Cliente creado');
}
```

### 3. Estadísticas con callback

```php
$stats = CacheService::getDashboardStats($userId, function () use ($userId) {
    return [
        'total' => Ticket::count(),
        'open' => Ticket::where('status', 'Open')->count(),
        // ...
    ];
});
```

### 4. Caché con filtros (clave dinámica)

```php
$filters = ['date_from' => '2026-01-01', 'support_id' => 5];
$cacheKey = 'technician_ranking:' . md5(serialize($filters));

$ranking = CacheService::getTechnicianRankingStats($cacheKey, function () use ($filters) {
    return Support::query()
        ->withCount(['tickets' => function ($q) use ($filters) { /* aplicar filtros */ }])
        ->get();
});
```

## Cuándo invalidar

| Evento | Acción |
|--------|--------|
| `Customer::created/updated/deleted` | `clearCustomersCache()` |
| `Support::created/updated/deleted` | `clearSupportsCache()` |
| `Holiday::created/updated/deleted` | `clearHolidaysCache()` |
| Cambio masivo / seeder | `clearAll()` |

## Opción avanzada: Observer de Eloquent

```php
// app/Observers/CustomerObserver.php
class CustomerObserver
{
    public function saved(Customer $customer): void
    {
        CacheService::clearCustomersCache();
    }

    public function deleted(Customer $customer): void
    {
        CacheService::clearCustomersCache();
    }
}

// app/Providers/AppServiceProvider.php
public function boot(): void
{
    Customer::observe(CustomerObserver::class);
}
```

## Estadísticas compartidas (HandleInertiaRequests)

`HandleInertiaRequests` comparte stats con todas las vistas:

```php
public function share(Request $request): array
{
    $cacheTime = config('app.debug') ? 60 : 300;

    $totalCustomers = cache()->remember('stats:total_customers', $cacheTime,
        fn() => Customer::count());

    $ticketByStatus = cache()->remember('stats:ticket_by_status', 300,
        fn() => Ticket::query()
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($item) => [$item->status => $item->count])
            ->all());

    return [
        // ...
        'totalCustomers' => $totalCustomers,
        'ticketByStatus' => $ticketByStatus,
    ];
}
```

> Stats globales. No usar para datos filtrados por usuario (seguridad).

## Configuración

### Producción (Laravel Cloud)

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
CACHE_PREFIX=auxora_
```

Laravel Cloud provee `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` automáticamente.

### Local (Laragon)

```env
# Opción A: simple
CACHE_STORE=file

# Opción B: con Redis (idéntico a producción)
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Verificar Redis local: `redis-cli ping` → `PONG`.

## Debugging

```bash
# Limpiar toda la caché
php artisan cache:clear
php artisan optimize:clear

# Verificar Redis
php artisan tinker
> Redis::ping()
> Cache::getRedis()->keys('*')

# Pre-cargar catálogos críticos
php artisan cache:warmup

# Verificar salud
php artisan health:check

# En tests
beforeEach(function () { Cache::flush(); });
```

## Errores comunes

❌ Cachear datos sensibles sin encriptar (tokens, passwords)  
❌ Cachear resultados por usuario sin clave única (fuga de datos)  
❌ Olvidar invalidar caché al mutar (datos obsoletos)  
❌ TTL demasiado largo para datos críticos  
❌ `Cache::forever()` salvo casos justificados  
❌ `Cache::remember()` directo (usar CacheService)

✅ Usar CacheService siempre  
✅ Elegir TTL según volatilidad  
✅ Invalidar al mutar  
✅ Agrupar invalidaciones por dominio  
✅ Ejecutar `cache:warmup` después de deploys

## Anti-patrón: caché dispersa

```php
// ❌ MAL — cada controlador con su propia key y TTL
class CustomerController {
    public function index() {
        $data = Cache::remember('my_customers_' . now()->hour, 600, fn() => ...);
    }
}

// ✅ BIEN — centralizado
class CustomerController {
    public function index() {
        $data = CacheService::getCustomersList();
    }
}
```
