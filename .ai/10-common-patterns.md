# 🔁 10 — Patrones Comunes del Proyecto

Esta guía documenta los **patrones recurrentes** que se usan en el proyecto. Aplicar estos patrones al agregar nuevas funcionalidades.

---

## 1. 📋 Filtros por Rol en Listados

Cuando un endpoint lista datos, aplicar visibilidad según rol.

### Implementación

```php
public function index(Request $request)
{
    $user = auth()->user();
    $query = Model::query()->select(/* ... */)->with(/* ... */);

    // Visibilidad por rol
    match (true) {
        $user->hasRole('support') => $query->where('support_id', $this->getSupportId($user)),
        $user->hasRole('customer') => $query->where('customer_id', $this->getCustomerId($user)),
        $user->hasRole('Comercial') => $query->where('user_id', $user->id),
        default => null,  // admin y Coordinador ven todo
    };

    // Filtros adicionales del usuario
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    return Inertia::render('Xxx/Index', [
        'items' => $query->latest()->paginate(10),
        'filters' => $request->only(['status']),
    ]);
}
```

---

## 2. 🏗️ Crear Recurso con Auditoría

Patrón para crear un ticket/recurso con historial, documentos y notificaciones.

```php
public function store(StoreXxxRequest $request)
{
    $data = $request->validated();

    $item = DB::transaction(function () use ($data, $request) {
        // 1. Crear entidad principal
        $item = Xxx::create($data);

        // 2. Manejar archivos (subir a disco configurado: S3 en prod)
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store("xxx/{$item->id}", config('filesystems.default'));
                $item->documents()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'uploaded_by' => auth()->id(),
                ]);
            }
        }

        // 3. Registrar en historial
        $item->histories()->create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'description' => "Xxx creado",
        ]);

        // 4. Limpiar caché relacionado
        CacheService::clearXxxCache();

        return $item;
    });

    return redirect()
        ->route('xxx.show', $item)
        ->with('success', 'Xxx creado correctamente');
}
```

---

## 3. 🔄 Cambio de Estado con Auditoría

```php
public function updateStatus(Request $request, Ticket $ticket)
{
    $data = $request->validate([
        'status' => ['required', Rule::in(['Open', 'In Progress', 'Closed'])],
    ]);

    $oldStatus = $ticket->status;
    $newStatus = $data['status'];

    DB::transaction(function () use ($ticket, $oldStatus, $newStatus) {
        $ticket->update([
            'status' => $newStatus,
            'closed_at' => $newStatus === 'Closed' ? now() : null,
        ]);

        $ticket->histories()->create([
            'user_id' => auth()->id(),
            'action' => 'status_changed',
            'field' => 'status',
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
            'description' => "Estado cambiado de {$oldStatus} a {$newStatus}",
        ]);
    });

    return back()->with('success', 'Estado actualizado');
}
```

---

## 4. 🛡️ Autorización por Visibilidad en Show/Edit/Delete

```php
private function authorizeAccess(Ticket $ticket): void
{
    $user = auth()->user();

    // Admin y Coordinador: todo
    if ($user->hasAnyRole(['admin', 'Coordinador'])) {
        return;
    }

    // Support: solo sus tickets
    if ($user->hasRole('support')) {
        $support = Support::where('email', $user->email)->first();
        abort_unless($support && $ticket->support_id === $support->id, 403);
        return;
    }

    // Customer: solo sus tickets
    if ($user->hasRole('customer')) {
        $customer = Customer::where('email', $user->email)->first();
        abort_unless($customer && $ticket->customer_id === $customer->id, 403);
        return;
    }

    // Comercial: solo los que creó
    if ($user->hasRole('Comercial')) {
        abort_unless($ticket->user_id === $user->id, 403);
        return;
    }
}

public function show(Ticket $ticket)
{
    $this->authorizeAccess($ticket);
    // ...
}

public function edit(Ticket $ticket)
{
    $this->authorizeAccess($ticket);
    // ...
}

public function update(UpdateTicketRequest $request, Ticket $ticket)
{
    $this->authorizeAccess($ticket);
    // ...
}

public function destroy(Ticket $ticket)
{
    $this->authorizeAccess($ticket);
    // ...
}
```

---

## 5. 📊 Exportación con Filtros

### Excel

```php
public function exportTickets(Request $request)
{
    $filters = $request->only(['status', 'date_from', 'date_to', 'support_id']);

    return Excel::download(
        new TicketsExport($filters),
        'tickets-' . now()->format('Y-m-d') . '.xlsx'
    );
}
```

```php
// app/Exports/TicketsExport.php
class TicketsExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    public function __construct(private array $filters) {}

    public function query()
    {
        $query = Ticket::query()
            ->with(['customer:id,name', 'support:id,name']);

        // Aplicar filtros (igual que index)
        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }
        // ...

        return $query;
    }

    public function headings(): array
    {
        return ['ID', 'Cliente', 'Técnico', 'Asunto', 'Estado', 'Creado'];
    }

    public function map($ticket): array
    {
        return [
            $ticket->id,
            $ticket->customer?->name,
            $ticket->support?->name,
            $ticket->subject,
            $ticket->status,
            $ticket->created_at->format('d/m/Y'),
        ];
    }
}
```

### PDF

```php
public function exportTicketsPdf(Request $request)
{
    $tickets = $this->getFilteredTickets($request);

    $pdf = Pdf::loadView('exports.tickets-pdf', [
        'tickets' => $tickets,
        'filters' => $request->only(['status', 'date_from']),
    ])->setPaper('a4', 'landscape');

    return $pdf->download('tickets-' . now()->format('Y-m-d') . '.pdf');
}
```

---

## 6. 📥 Descarga de Archivos con Autorización

```php
public function downloadDocument(TicketDocument $document)
{
    // Verificar que el usuario tiene acceso al ticket
    $ticket = $document->ticket;
    $this->authorizeAccess($ticket);

    // Verificar que el archivo existe (en disco configurado: S3 en prod)
    if (!Storage::disk(config('filesystems.default'))->exists($document->file_path)) {
        abort(404, 'Archivo no encontrado');
    }

    return Storage::disk(config('filesystems.default'))->download(
        $document->file_path,
        $document->file_name
    );
}
```

---

## 7. 🔍 Búsqueda Multi-campo

```php
public function index(Request $request)
{
    $query = Ticket::query();

    if ($search = $request->query('search')) {
        $query->where(function ($q) use ($search) {
            $q->where('subject', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('serial', 'like', "%{$search}%")
              ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%{$search}%"));
        });
    }

    // ...
}
```

---

## 8. 📅 Reportes con Filtro de Fechas

```php
public function exportByDateRange(Request $request)
{
    $data = $request->validate([
        'date_from' => ['required', 'date'],
        'date_to' => ['required', 'date', 'after_or_equal:date_from'],
    ]);

    $tickets = Ticket::query()
        ->whereBetween('created_at', [$data['date_from'], $data['date_to']])
        ->with(['customer', 'support'])
        ->get();

    return Excel::download(
        new TicketsExport($tickets->toArray()),
        'tickets-' . $data['date_from'] . '_' . $data['date_to'] . '.xlsx'
    );
}
```

---

## 9. 💬 Comentarios con Adjuntos

```php
public function storeComment(Request $request, Ticket $ticket)
{
    $data = $request->validate([
        'comment' => ['required', 'string', 'max:5000'],
        'attachments.*' => ['nullable', 'file', 'max:10240'],
    ]);

    DB::transaction(function () use ($ticket, $data, $request) {
        $comment = $ticket->comments()->create([
            'user_id' => auth()->id(),
            'comment' => $data['comment'],
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store("comment-attachments/{$ticket->id}", config('filesystems.default'));
                $comment->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        $ticket->histories()->create([
            'user_id' => auth()->id(),
            'action' => 'commented',
            'description' => 'Comentario agregado',
        ]);
    });

    return back()->with('success', 'Comentario agregado');
}
```

---

## 10. 🧮 Cálculo de Métricas con Caché

```php
public function getMetrics(Request $request)
{
    $userId = auth()->id();
    $filters = $request->only(['date_from', 'date_to']);

    return CacheService::getDashboardStats($userId, function () use ($filters) {
        $query = Ticket::query();

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        return [
            'total' => $query->count(),
            'open' => (clone $query)->where('status', 'Open')->count(),
            'in_progress' => (clone $query)->where('status', 'In Progress')->count(),
            'closed' => (clone $query)->where('status', 'Closed')->count(),
            'avg_resolution_hours' => $this->calculateAvgResolution($query),
            'by_status' => (clone $query)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
        ];
    });
}
```

---

## 11. 🎫 Notificaciones (Mailables)

```php
// En el controlador
use Illuminate\Support\Facades\Mail;
use App\Mail\TicketAssigned;

$ticket->update(['support_id' => $support->id, 'status' => 'In Progress']);

Mail::to($support->email)->send(new TicketAssigned($ticket));
```

```php
// app/Mail/TicketAssigned.php
class TicketAssigned extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Ticket $ticket) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Nuevo ticket asignado: {$this->ticket->id}");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tickets.assigned',
            with: ['ticket' => $this->ticket, 'url' => route('tickets.show', $this->ticket)],
        );
    }
}
```

---

## 12. 🔗 Helper de Inertia Compartido

Datos disponibles en **todas las páginas**:

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        'auth' => [
            'user' => $request->user(),
            'roles' => $request->user()?->getRoleNames() ?? [],
            'permissions' => $request->user()?->getAllPermissions()->pluck('name') ?? [],
        ],
        'flash' => [
            'success' => fn() => $request->session()->get('success'),
            'error' => fn() => $request->session()->get('error'),
            // ...
        ],
        'ziggy' => fn() => [...],
        'totalCustomers' => cache()->remember('stats:total_customers', 300, fn() => Customer::count()),
        // ...
    ];
}
```

Uso en React:
```tsx
const { auth, flash } = usePage().props;
const { hasPermission } = usePermissions();
```

---

## 13. 🔧 Service para Lógica Reutilizable

Cuando un helper se usa en >3 lugares con lógica compleja:

```php
// app/Services/CacheService.php (existente)
class CacheService
{
    public static function getCustomersList() { /* ... */ }
    public static function clearCustomersCache() { /* ... */ }
}
```

```php
// Crear nuevo: app/Services/TicketService.php
class TicketService
{
    public static function applyVisibility($query, User $user): void
    {
        if ($user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            $query->where('support_id', $support?->id ?? 0);
        }
        // ...
    }
}

// Uso
TicketService::applyVisibility($query, $user);
```

---

## 14. 📋 Comando Artisan para Tareas Programadas

```php
// app/Console/Commands/CleanupSessions.php
class CleanupSessions extends Command
{
    protected $signature = 'sessions:cleanup {--days=30}';
    protected $description = 'Limpiar sesiones antiguas';

    public function handle(): int
    {
        $days = $this->option('days');
        $deleted = DB::table('sessions')
            ->where('last_activity', '<', now()->subDays($days)->timestamp)
            ->delete();

        $this->info("{$deleted} sesiones eliminadas");
        return self::SUCCESS;
    }
}

// routes/console.php
Schedule::command('sessions:cleanup')->daily();
```

---

## 15. 🧪 Test Rápido de Permisos

```php
test('coordinator can view all tickets', function () {
    $coordinator = User::factory()->create()->assignRole('Coordinador');
    $tickets = Ticket::factory()->count(5)->create();

    foreach ($tickets as $ticket) {
        $response = $this->actingAs($coordinator)
            ->get(route('tickets.show', $ticket));
        $response->assertOk();
    }
});
```

---

**Siguiente**: [11-dos-and-donts.md](11-dos-and-donts.md) — ✅ Buenas prácticas y ❌ Anti-patrones.
