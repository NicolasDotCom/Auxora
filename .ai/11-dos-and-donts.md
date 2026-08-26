# ✅❌ 11 — Buenas Prácticas y Anti-patrones

Lista rápida de referencia para tomar decisiones rápidas durante el desarrollo.

---

## 🔐 Seguridad

### ✅ SÍ

```php
// ✅ Validar en FormRequest
public function store(StoreTicketRequest $request) { ... }

// ✅ Middleware de permiso en constructor
public function __construct() {
    $this->middleware('permission:view ticket')->only(['index', 'show']);
}

// ✅ Visibilidad por rol en query
if ($user->hasRole('support')) {
    $query->where('support_id', $support->id);
}

// ✅ Verificar acceso antes de retornar
$this->authorizeAccess($ticket);

// ✅ Usar $fillable (no $guarded = [])
protected $fillable = ['name', 'email'];

// ✅ CSRF automático en formularios Inertia
// ✅ Hash de password (cast 'hashed')

// ✅ Verificar archivo antes de descargar (disco configurado: S3 en prod)
if (!Storage::disk(config('filesystems.default'))->exists($document->file_path)) {
    abort(404);
}

// ✅ Sanitizar input de usuario
$validated = $request->validated();
```

### ❌ NO

```php
// ❌ Validar en controlador
public function store(Request $request) {
    $request->validate([...]);  // ❌
}

// ❌ Omitir middleware
Route::get('/users', [UserController::class, 'index']);

// ❌ Confiar solo en frontend
{hasPermission('delete ticket') && <DeleteButton />}  // ❌ Sin backend check

// ❌ $guarded = []
protected $guarded = [];  // ❌ Riesgo de mass-assignment

// ❌ Acceso sin autorización
public function show(Ticket $ticket) {
    return view('ticket', ['ticket' => $ticket]);  // ❌ Sin check
}

// ❌ Exponer datos sensibles
$user->password;  // ❌
$user->remember_token;  // ❌

// ❌ SQL crudo sin binding
DB::statement("DELETE FROM tickets WHERE id = $id");  // ❌ SQL Injection

// ❌ MD5/SHA1 para passwords
Hash::make($password);  // ❌ Usar bcrypt/argon2 (ya automático con cast 'hashed')
```

---

## ⚡ Performance

### ✅ SÍ

```php
// ✅ Eager loading
$tickets = Ticket::with(['customer:id,name', 'support:id,name'])->get();

// ✅ Select específico
$tickets = Ticket::select('id', 'subject', 'status')->get();

// ✅ withCount para contadores
$tickets = Ticket::withCount('documents')->get();

// ✅ Paginación
$tickets = Ticket::paginate(10);

// ✅ Índices en columnas frecuentes
$table->index('status');
$table->index(['status', 'created_at']);  // Compuesto

// ✅ Cachear catálogos
$customers = CacheService::getCustomersList();

// ✅ Invalidar caché al mutar
CacheService::clearCustomersCache();

// ✅ Chunk para procesos grandes
Ticket::chunk(100, function ($tickets) {
    foreach ($tickets as $ticket) {
        // procesar
    }
});

// ✅ exists() en lugar de count() > 0
if (Ticket::where('status', 'Open')->exists()) { ... }

// ✅ pluck para una columna
$names = Customer::pluck('name');
```

### ❌ NO

```php
// ❌ Lazy loading en vistas
@foreach ($tickets as $ticket)
    {{ $ticket->customer->name }}  // ❌ N+1
@endforeach

// ❌ SELECT *
$tickets = Ticket::all();

// ❌ all() sin paginar
return Inertia::render('Tickets/Index', [
    'tickets' => Ticket::all(),  // ❌ Miles de registros
]);

// ❌ count() > 0
if (Ticket::where('status', 'Open')->count() > 0) { ... }  // ❌

// ❌ Caché manual disperso
Cache::remember('my_customers', 900, fn() => ...);  // ❌ Usar CacheService

// ❌ Caché sin invalidación
$customers = CacheService::getCustomersList();  // ❌ Si luego mutas, olvidar limpiar

// ❌ Queries dentro de loops
foreach ($customers as $customer) {
    $tickets = Ticket::where('customer_id', $customer->id)->get();  // ❌ N+1
}
```

---

## 🎨 Código Limpio

### ✅ SÍ

```php
// ✅ Métodos cortos y con propósito
public function index(Request $request): Response
{
    $tickets = $this->buildTicketQuery($request)->paginate(10);
    return Inertia::render('Tickets/Index', ['tickets' => $tickets]);
}

private function buildTicketQuery(Request $request): Builder
{
    $query = Ticket::query()->with([...]);
    // ... filtros
    return $query;
}

// ✅ Tipos explícitos
public function getCustomer(int $id): Customer
{
    return Customer::findOrFail($id);
}

// ✅ Constantes en lugar de magic strings
const STATUS_OPEN = 'Open';
const STATUS_IN_PROGRESS = 'In Progress';
const STATUS_CLOSED = 'Closed';

// ✅ Scopes reutilizables
public function scopeOpen($query)
{
    return $query->where('status', 'Open');
}

// ✅ Enums para valores cerrados
enum TicketStatus: string
{
    case Open = 'Open';
    case InProgress = 'In Progress';
    case Closed = 'Closed';
}

// ✅ Readonly properties
class TicketFilter
{
    public function __construct(
        public readonly ?string $status,
        public readonly ?Carbon $dateFrom,
        public readonly ?Carbon $dateTo,
    ) {}
}
```

### ❌ NO

```php
// ❌ Método de 100 líneas
public function index() {
    // 80 líneas de lógica
}

// ❌ Magic strings
if ($ticket->status === 'Open') { ... }

// ❌ Sin tipos
public function getCustomer($id) { ... }

// ❌ Catch vacío
try {
    // ...
} catch (\Throwable $e) {
    // silencio  ❌
}

// ❌ Booleanos sin contexto
$active = true;  // ❌ ¿Qué significa "active"?

// ❌ Variables con nombre críptico
$t = Ticket::find($id);
$u = User::find($uid);

// ❌ Código muerto
// $oldCode = ...;
```

---

## 🧪 Testing

### ✅ SÍ

```php
// ✅ Nombre descriptivo
test('admin can create a ticket', function () {
    // ...
});

test('support user cannot access customer management', function () {
    // ...
});

// ✅ AAA pattern
test('user can update profile', function () {
    // Arrange
    $user = User::factory()->create();

    // Act
    $response = $this->actingAs($user)
        ->patch(route('profile.update'), ['name' => 'New']);

    // Assert
    $response->assertRedirect();
    expect($user->fresh()->name)->toBe('New');
});

// ✅ Factories
$ticket = Ticket::factory()->create();

// ✅ RefreshDatabase (vía Pest.php)

// ✅ Test edge cases
test('returns 404 when ticket does not exist', function () { ... });
test('handles empty list', function () { ... });

// ✅ Mockear externos
Mail::fake();
Storage::fake('public');
```

### ❌ NO

```php
// ❌ Nombre vago
test('test 1', function () { ... });

// ❌ Datos hardcoded
$user = User::create([
    'name' => 'Juan',
    'email' => 'juan@example.com',
]);  // ❌ Usar factory

// ❌ Test que depende de otro
test('first test', function () {
    $this->user = User::factory()->create();
});
test('uses user from previous test', function () {
    $user = $this->user;  // ❌ Frágil
});

// ❌ Testear detalles de implementación
expect($ticket->getAttributes())->toHaveKey('status');  // ❌ Testear comportamiento

// ❌ Omitir autorización
test('user can delete ticket', function () {
    // No verifica que solo admin pueda  ❌
});
```

---

## 📐 Convenciones del Proyecto

### ✅ SÍ

```php
// ✅ Comentarios PHPDoc para métodos públicos
/**
 * Display a listing of tickets with role-based visibility.
 */
public function index(Request $request) { ... }

// ✅ Uso de match en lugar de switch (PHP 8)
$result = match($role) {
    'admin' => 'all',
    'support' => 'assigned',
    'customer' => 'own',
};

// ✅ Named arguments cuando hay muchos parámetros
$ticket = Ticket::create([
    'subject' => 'Soporte',
    'description' => '...',
    'status' => 'Open',
    // ...
]);

// ✅ Uso de Str helper
Str::slug($name);
Str::limit($description, 100);

// ✅ Carbon para fechas
use Carbon\Carbon;
$now = now();  // Helper
$today = Carbon::today();
```

### ❌ NO

```php
// ❌ Switch antiguo
switch ($role) {
    case 'admin':
        // ...
        break;
}

// ❌ new DateTime() (usar Carbon)
$date = new DateTime();  // ❌

// ❌ Strings de fecha sin parsear
'tickets-' . date('Y-m-d');  // ❌ Carbon/now()->format

// ❌ Query strings en URLs
'/tickets?status=Open';  // ❌ Usar route() helper
```

---

## 🎨 Frontend

### ✅ SÍ

```tsx
// ✅ Tipos explícitos
interface TicketCardProps {
    ticket: Ticket;
    onEdit: (id: number) => void;
}

// ✅ Componente funcional con nombre
export function TicketCard({ ticket, onEdit }: TicketCardProps) {
    return <div>...</div>;
}

// ✅ Custom hooks para lógica reutilizable
const { hasPermission } = usePermissions();

// ✅ useForm de Inertia para formularios
const { data, setData, post, processing, errors } = useForm({...});

// ✅ Link para navegación interna
<Link href={route('tickets.show', id)}>Ver</Link>

// ✅ Toast para feedback
toast.success('Guardado');

// ✅ Head para títulos
<Head title="Tickets" />

// ✅ Helpers de Tailwind
<div className={cn('p-4', isActive && 'bg-blue-500')} />
```

### ❌ NO

```tsx
// ❌ any sin justificación
const ticket: any = ...;

// ❌ <a href> para navegación interna
<a href="/tickets/1">Ver</a>  // ❌ Recarga la página

// ❌ fetch directo a rutas Laravel
const res = await fetch('/api/tickets', { method: 'POST', ... });  // ❌

// ❌ Rutas hardcoded
<Link href={`/tickets/${id}`}>Ver</Link>  // ❌ Usar route()

// ❌ useState para formularios grandes
const [subject, setSubject] = useState('');
const [description, setDescription] = useState('');
// ... 15 useState  ❌ Usar useForm

// ❌ window.location.href
window.location.href = '/tickets';  // ❌ Usar router.visit
```

---

## 🗃️ Base de Datos

### ✅ SÍ

```php
// ✅ Migración explícita con down()
public function up(): void
{
    Schema::create('tickets', function (Blueprint $table) {
        $table->id();
        $table->string('subject', 100);
        $table->text('description');
        $table->enum('status', ['Open', 'In Progress', 'Closed'])->default('Open');
        $table->foreignId('customer_id')->nullable()->constrained();
        $table->timestamps();

        $table->index('status');
        $table->index(['status', 'created_at']);
    });
}

public function down(): void
{
    Schema::dropIfExists('tickets');
}

// ✅ Foreign keys con onDelete definido
$table->foreignId('customer_id')->constrained()->onDelete('cascade');

// ✅ Soft deletes cuando aplica
$table->softDeletes();

// ✅ Modificar columnas en migraciones separadas (no editar existentes)
// migrations/2026_01_05_add_field_to_tickets.php
```

### ❌ NO

```php
// ❌ Sin down()
public function up(): void { /* ... */ }
// sin down()  ❌

// ❌ Editar migraciones ya ejecutadas
// 2025_03_22_144024_create_tickets_table.php  ❌
// Crear nueva: 2026_01_05_add_field_to_tickets_table.php

// ❌ Sin índice en FK
$table->bigInteger('customer_id');  // ❌ Usar foreignId() que crea índice

// ❌ onDelete restrictivo por defecto sin razón
$table->foreignId('customer_id')->constrained();  // ❌ cascade si se elimina cliente
```

---

## 📦 Git

### ✅ SÍ

```bash
# ✅ Commits atómicos y descriptivos
git commit -m "feat: agregar endpoint para exportar tickets a Excel"
git commit -m "fix: corregir cálculo de días laborables en sábados"
git commit -m "refactor: extraer lógica de visibilidad a TicketPolicy"

# ✅ Branches por feature
git checkout -b feature/api-rate-limiting
git checkout -b fix/ticket-status-validation
git checkout -b refactor/cache-service
```

### ❌ NO

```bash
# ❌ Mensajes vagos
git commit -m "cambios"
git commit -m "fix"
git commit -m "wip"

# ❌ Commits enormes no relacionados
git commit -m "fix bug, add feature, refactor module, update deps"  # ❌

# ❌ Commitear secretos
# .env
# api_keys.txt
```

---

## 🎯 Resumen Rápido

| Categoría | ✅ | ❌ |
|-----------|---|---|
| **Validación** | FormRequest | En controlador |
| **Autorización** | Middleware + query | Solo frontend |
| **Queries** | Eager + select + paginate | all() + lazy + select * |
| **Caché** | CacheService | Cache:: directo |
| **Lógica** | En Services | En controladores |
| **Tests** | Pest + factories | Hardcoded + acoplamiento |
| **Frontend** | useForm + Link + cn | fetch + a + useState |
| **Git** | Conventional commits | "cambios" |
| **Tipos** | TS estricto, PHP tipado | any, sin tipos |

---

## 📚 Referencias Rápidas

- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices)
- [Spatie Permission Docs](https://spatie.be/docs/laravel-permission)
- [Inertia.js Docs](https://inertiajs.com/)
- [Pest PHP Docs](https://pestphp.com/)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

**Versión**: 1.0  
**Mantenedor**: Equipo Ticket TES  
**Última actualización**: Enero 2026
