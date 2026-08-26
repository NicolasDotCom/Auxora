# 05 — Estándares y Convenciones de Código

## Principios rectores

1. **Claridad > Cleverness** — se lee más veces de las que se escribe.
2. **Consistencia > Perfección** — patrón imperfecto > ningún patrón.
3. **Explícito > Implícito** — verboso pero claro.
4. **YAGNI** — no agregar funcionalidades hasta necesitarlas.
5. **DRY** — si se repite >2 veces, extraer.

## PHP / Laravel

### Tipado estricto

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        // ...
    }
}
```

### Naming

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clase | PascalCase | `TicketController`, `CacheService` |
| Método | camelCase | `updateStatus`, `getWorkingDays` |
| Variable | camelCase | `$ticketId`, `$userName` |
| Constante | UPPER_SNAKE | `DEFAULT_TTL`, `STATS_TTL` |
| Tabla BD | snake_case (plural) | `tickets`, `ticket_comments` |
| Columna BD | snake_case | `support_id`, `assigned_at` |
| Ruta | kebab-case | `/ticket-documents`, `/pending-parts` |
| Permiso | "verb entity" | `view ticket`, `edit customer` |

### Estructura de controladores

```php
class XxxController extends Controller
{
    // 1. Constructor (middleware)
    public function __construct()
    {
        $this->middleware('permission:view xxx')->only(['index', 'show']);
        $this->middleware('permission:create xxx')->only(['create', 'store']);
    }

    // 2. Métodos públicos (orden: index, create, store, show, edit, update, destroy)

    // 3. Métodos auxiliares privados al final
}
```

### Form Requests SIEMPRE

```php
// ✅ Correcto
public function store(StoreTicketRequest $request)
{
    $data = $request->validated();
}

// ❌ Incorrecto
public function store(Request $request)
{
    $data = $request->validate(['subject' => 'required|string']);
}
```

Estructura completa en [10-common-patterns.md](10-common-patterns.md).

### Queries Eloquent

```php
// ✅ Select específico + eager loading
$tickets = Ticket::select('id', 'subject', 'status', 'customer_id')
    ->with(['customer:id,name', 'support:id,name'])
    ->withCount('documents')
    ->where('status', 'Open')
    ->latest()
    ->paginate(10);

// ❌ Select * + lazy loading
$tickets = Ticket::all();
foreach ($tickets as $ticket) {
    echo $ticket->customer->name;  // N+1!
}
```

### Caché explícita

```php
// ✅ CacheService
use App\Services\CacheService;
$customers = CacheService::getCustomersList();

// ❌ Cache directo sin servicio
$customers = Cache::remember('customers', 900, fn() => Customer::all());
```

Detalle completo en [07-caching-strategy.md](07-caching-strategy.md).

### Manejo de errores

```php
// ✅ Try/catch solo cuando aporta
try {
    DB::transaction(function () use ($data) {
        $ticket = Ticket::create($data);
        $ticket->histories()->create([...]);
    });
} catch (\Throwable $e) {
    Log::error('Error creando ticket', [
        'error' => $e->getMessage(),
        'data' => $data,
    ]);
    return back()->with('error', 'No se pudo crear el ticket');
}

// ❌ Try/catch vacío
try { /* ... */ } catch (\Throwable $e) { /* silencio */ }
```

### Respuestas Inertia

```php
// ✅ Con flash message
return redirect()->route('tickets.index')
    ->with('success', 'Ticket creado correctamente');

// ✅ Validación fallida (automática con FormRequest)
// back()->withErrors(...) lo maneja Laravel

// ❌ Retornar excepciones a la vista
return response()->json(['error' => '...']);  // Solo para API
```

## React / TypeScript

### TypeScript estricto

```ts
// ✅ Tipos explícitos
interface Ticket {
    id: number;
    subject: string;
    status: 'Open' | 'In Progress' | 'Closed';
    customer?: Customer;
}

// ❌ any sin justificación
const tickets: any = await fetchTickets();
```

### Componentes funcionales

```tsx
interface TicketCardProps {
    ticket: Ticket;
    onEdit?: (id: number) => void;
}

export function TicketCard({ ticket, onEdit }: TicketCardProps) {
    return (
        <div className="rounded-lg border p-4">
            <h3>{ticket.subject}</h3>
            {onEdit && (
                <button onClick={() => onEdit(ticket.id)}>Editar</button>
            )}
        </div>
    );
}

// ❌ Arrow function sin nombre (difícil de debuggear)
export default ({ ticket, onEdit }: TicketCardProps) => (/* ... */);
```

### Naming (frontend)

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componente | PascalCase | `TicketCard`, `DataTable` |
| Hook | use + camelCase | `usePermissions`, `useAuth` |
| Utilidad | camelCase | `formatDate`, `cn` |
| Constante | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |
| Tipo/Interface | PascalCase | `Ticket`, `UserData` |
| Archivo página | PascalCase | `Index.tsx`, `Create.tsx` |
| Archivo componente | kebab-case | `ticket-card.tsx` |
| Archivo hook | kebab-case | `use-permissions.ts` |

### Custom Hooks

```tsx
// ✅ Hook con propósito claro
export function usePermissions() {
    const page = usePage();
    const auth = page.props.auth;

    const hasPermission = (permission: string): boolean => {
        return auth.permissions?.includes(permission) ?? false;
    };

    return { hasPermission, hasRole: /* ... */ };
}

// ❌ Hook genérico con mucha lógica
function useEverything() { /* ... */ }
```

### Forms con Inertia

```tsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({
    subject: '',
    description: '',
    customer_id: '',
});

const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tickets.store'), {
        onSuccess: () => toast.success('Ticket creado'),
    });
};

return (
    <form onSubmit={submit}>
        <Input value={data.subject}
               onChange={(e) => setData('subject', e.target.value)}
               error={errors.subject} />
        <Button type="submit" disabled={processing}>Guardar</Button>
    </form>
);
```

## Tailwind CSS

### Orden de utilidades
1. Layout (display, position)
2. Box model (sizing, spacing, padding)
3. Tipografía y color
4. Borders, shadows, efectos
5. Estados (hover, focus)

```tsx
<button className="flex w-full p-4 text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2">
```

### Helper `cn`

```ts
// resources/js/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Uso
<div className={cn('p-4', isActive && 'bg-blue-500', className)} />
```

## Comentarios

### Cuándo SÍ
```php
// ✅ Justificar decisiones no obvias
// Usamos whereHas en lugar de join para mantener legibilidad
// y aprovechar el caché de relaciones de Eloquent.
$tickets = Ticket::whereHas('customer', fn($q) => $q->where('active', true))->get();

/**
 * Calcula horas laborables considerando:
 * - Lunes a viernes: 08:00 - 18:00
 * - Sábado: 09:00 - 13:00
 * - Domingo y festivos: no cuentan
 */
public static function getWorkingHours(...): float
```

### Cuándo NO
```php
// ❌ Redundante
// Incrementar contador en 1
$counter++;

// ❌ Código comentado (usar git)
$oldLogic = function () { /* ... */ };
```

## Code Smells

| Smell | Solución |
|-------|----------|
| Función >50 líneas | Extraer a Service o método privado |
| Controller con lógica | Mover a Service |
| Validación en Controller | Mover a FormRequest |
| Query repetida >2 veces | Scope en Model o método en Service |
| Catch vacío | Loggear o rethrow |
| Magic strings/numbers | Constantes o enums |
| N+1 queries | Eager loading |
| SELECT * | `select()` explícito |
| Booleanos sin contexto | Enums |

## Git commits (Conventional Commits)

```
feat: agregar endpoint para exportar tickets a Excel
fix: corregir cálculo de días laborables en sábados
refactor: extraer lógica de visibilidad a TicketPolicy
docs: actualizar README con instrucciones de deploy
test: agregar tests para CacheService
chore: actualizar dependencias de npm
```

## Comandos de calidad

```bash
# Backend
./vendor/bin/pint              # Formatear
./vendor/bin/pint --test       # Solo verificar

# Frontend
pnpm run lint                  # ESLint
pnpm run lint -- --fix         # Auto-fix
pnpm run format                # Prettier
pnpm run types                 # TypeScript check
```
