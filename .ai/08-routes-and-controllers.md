# 🛣️ 08 — Rutas y Controladores

## 📁 Estructura de Rutas

```
routes/
├── web.php        # Rutas principales (Inertia)
├── api.php        # API REST (Sanctum)
├── auth.php       # Login, register, password reset
├── settings.php   # Perfil, password, appearance
└── console.php    # Comandos programados
```

---

## 🌐 routes/web.php

### Convenciones

- **Prefijos en español** para rutas de settings (`/settings/...`).
- **Recursos RESTful** cuando aplica.
- **Named routes** siempre (`->name('...')`).
- **Middleware agrupado** por nivel de acceso.

### Patrón típico

```php
// Público
Route::get('/', fn() => redirect()->route('login'))->name('home');

// Autenticados
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('tickets', TicketController::class);
    // ...
});

// Por rol
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    // Solo admin
});

// Por permiso
Route::middleware('permission:view analytics')->group(function () {
    Route::get('/analytics/technicians', /* ... */);
});
```

### Rutas principales del proyecto

| Método | URI | Nombre | Acción | Permisos |
|--------|-----|--------|--------|----------|
| GET | `/` | home | redirect login | público |
| GET | `/dashboard` | dashboard | DashboardController@index | auth |
| GET | `/tickets` | tickets.index | TicketController@index | view ticket |
| GET | `/tickets/create` | tickets.create | TicketController@create | create ticket |
| POST | `/tickets` | tickets.store | TicketController@store | create ticket |
| GET | `/tickets/{ticket}` | tickets.show | TicketController@show | view ticket |
| GET | `/tickets/{ticket}/edit` | tickets.edit | TicketController@edit | edit ticket |
| PUT | `/tickets/{ticket}` | tickets.update | TicketController@update | edit ticket |
| DELETE | `/tickets/{ticket}` | tickets.destroy | TicketController@destroy | delete ticket |
| PATCH | `/tickets/{ticket}/status` | tickets.update-status | TicketController@updateStatus | view ticket |
| POST | `/tickets/{ticket}/comments` | tickets.comments.store | TicketController@storeComment | view ticket |
| GET | `/tickets/{ticket}/duplicate` | tickets.duplicate | TicketController@duplicate | create ticket |
| GET | `/tickets/{ticket}/reporte-visita` | tickets.reporte-visita.form | TicketController@createVisitReport | view ticket |
| POST | `/tickets/{ticket}/reporte-visita` | tickets.reporte-visita.store | TicketController@storeVisitReport | view ticket |
| POST | `/ticket-documents/{document}/download` | ticket-documents.download | TicketController@downloadDocument | view ticket |
| DELETE | `/ticket-documents/{document}` | ticket-documents.destroy | TicketController@deleteDocument | edit ticket |
| GET | `/pending-parts` | pending-parts.index | PendingPartController@index | view ticket |
| POST | `/pending-parts` | pending-parts.store | PendingPartController@store | role:admin\|support\|Coordinador |
| PATCH | `/pending-parts/{pendingPart}/status` | pending-parts.update-status | PendingPartController@updateStatus | role:admin\|support\|Coordinador |
| GET | `/customers` | customers.index | CustomerController@index | view customer |
| GET | `/supports` | supports.index | SupportController@index | view support |
| GET | `/users` | users.index | UserController@index | admin |
| GET | `/users/roles` | users.roles.index | UserRoleController@index | admin |
| GET | `/roles` | roles.index | RoleController@index | admin |
| GET | `/analytics/technicians` | analytics.technicians | DashboardController@getTechnicianAnalytics | view analytics |
| GET | `/export-tickets` | export-tickets.view | DashboardController@exportView | export analytics |
| GET | `/api-demo/tickets` | api-demo.tickets | ApiTicketsDemoController@index | view api |
| GET | `/settings/api-tokens` | api-tokens.index | ApiTokenManagerController@index | manage api |
| GET | `/settings/holidays` | holidays.index | HolidayController@index | admin |
| GET | `/settings/backups` | backups.index | BackupController@index | admin |
| GET | `/diagnose/storage` | diagnose.storage | closure | admin |

---

## 🎮 Controladores

### Ubicación y Responsabilidad

```
app/Http/Controllers/
├── Controller.php                       # Base
├── TicketController.php                 # ⭐ Core (55KB)
├── CustomerController.php               # CRUD clientes
├── SupportController.php                # CRUD técnicos
├── UserController.php                   # CRUD usuarios (admin)
├── UserRoleController.php               # Asignar roles a usuarios
├── RoleController.php                   # CRUD roles (admin)
├── PendingPartController.php            # Repuestos pendientes
├── HolidayController.php                # Festivos
├── BackupController.php                 # Backups
├── DashboardController.php              # Stats + exports (35KB)
├── TechnicianAnalyticsController.php    # (vacío)
├── ApiTicketsDemoController.php         # Demo API
├── ApiTokenManagerController.php        # Gestión tokens
├── Auth/
│   ├── RegisteredUserController.php
│   ├── AuthenticatedSessionController.php
│   ├── PasswordController.php
│   └── NewPasswordController.php
└── Settings/
    ├── ProfileController.php
    └── PasswordController.php
```

---

### Patrón de Controlador Típico

```php
<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    /**
     * Middleware aplicado a nivel de controlador.
     */
    public function __construct()
    {
        $this->middleware('permission:view ticket')
            ->only(['index', 'show']);
        $this->middleware('permission:create ticket')
            ->only(['create', 'store', 'duplicate']);
        $this->middleware('permission:edit ticket')
            ->only(['edit', 'update']);
    }

    /**
     * Lista de tickets con filtros por rol.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = Ticket::select(/* campos específicos */)
            ->with(['customer:id,name,email', 'support:id,name'])
            ->withCount('documents');

        // Restricciones por rol
        if ($user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            $query->where('support_id', $support?->id);
        } elseif ($user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            $query->where('customer_id', $customer?->id);
        } elseif ($user->hasRole('Comercial')) {
            $query->where('user_id', $user->id);
        }

        // Aplicar filtros adicionales
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $tickets = $query->latest()->paginate(10);

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
            'customers' => CacheService::getCustomersList(),
            'supports' => CacheService::getSupportsList(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Tickets/Create', [
            'customers' => CacheService::getCustomersList(),
            'supports' => CacheService::getSupportsList(),
        ]);
    }

    public function store(StoreTicketRequest $request)
    {
        $data = $request->validated();

        $ticket = DB::transaction(function () use ($data) {
            $ticket = Ticket::create($data);

            $ticket->histories()->create([
                'user_id' => auth()->id(),
                'action' => 'created',
                'description' => "Ticket creado",
            ]);

            return $ticket;
        });

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Ticket creado correctamente');
    }

    public function show(Ticket $ticket)
    {
        // Verificar visibilidad por rol
        $this->authorizeView($ticket);

        $ticket->load([
            'customer', 'support', 'user',
            'documents', 'comments.user', 'comments.attachments',
            'histories.user', 'pendingParts',
        ]);

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    // ... edit, update, destroy
}
```

---

## 📝 Form Requests (Validación)

### Ubicación: `app/Http/Requests/`

```
Requests/
├── Auth/
└── Settings/
```

### Patrón

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create ticket');
        // O: return $this->user()->hasPermissionTo('create ticket');
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'cliente_externo' => ['nullable', 'string', 'max:255'],
            'support_id' => ['nullable', 'exists:supports,id'],
            'subject' => ['required', Rule::in([
                'Soporte', 'Mantenimiento', 'Instalación', /* ... */
            ])],
            'description' => ['required', 'string', 'max:5000'],
            'phone' => ['nullable', 'string', 'max:20'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'documents.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'El asunto es obligatorio',
            'subject.in' => 'El asunto seleccionado no es válido',
            'description.required' => 'La descripción es obligatoria',
            // ...
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_id' => 'cliente',
            'support_id' => 'técnico',
            // ...
        ];
    }
}
```

---

## 📤 Respuestas

### Con Inertia

```php
// ✅ Renderizar vista con props
return Inertia::render('Tickets/Index', [
    'tickets' => $tickets,
    'filters' => $filters,
]);

// ✅ Redirect con flash message
return redirect()
    ->route('tickets.index')
    ->with('success', 'Ticket creado');

// ✅ Volver con errores (automático en FormRequest)
return back()->withErrors($request->validator);

// ✅ Volver con input (en caso de error)
return back()->withInput();
```

### Flash Messages

```php
// Estándar
->with('success', '...')
->with('error', '...')
->with('warning', '...')
->with('info', '...')
```

Los flash messages se comparten vía `HandleInertiaRequests` y se acceden en React con `useFlash`.

### Para API (Sanctum)

```php
return response()->json([
    'success' => true,
    'data' => $ticket,
], 201);

return response()->json([
    'success' => false,
    'message' => 'No autorizado',
], 403);
```

---

## 🔄 Transacciones

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () use ($data) {
    $ticket = Ticket::create($data);

    if (isset($data['documents'])) {
        foreach ($data['documents'] as $file) {
            // ✅ Usar disco configurado (S3 en prod, local en dev)
            $path = $file->store('ticket-documents', config('filesystems.default'));
            $ticket->documents()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);
        }
    }

    $ticket->histories()->create([
        'user_id' => auth()->id(),
        'action' => 'created',
        'description' => 'Ticket creado',
    ]);
});
```

---

## 📁 Subida de Archivos

```php
public function store(StoreTicketRequest $request)
{
    $data = $request->validated();

    DB::transaction(function () use ($data, $request) {
        $ticket = Ticket::create($data);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                // ✅ Subir a disco configurado (S3 en prod, local en dev)
                $path = $file->store(
                    "ticket-documents/{$ticket->id}",
                    config('filesystems.default')
                );

                $ticket->documents()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'uploaded_by' => auth()->id(),
                ]);
            }
        }
    });
}
```

---

## 📊 Exportación (Excel / PDF)

### Excel (Maatwebsite)

```php
use App\Exports\TicketsExport;
use Maatwebsite\Excel\Facades\Excel;

return Excel::download(new TicketsExport($filters), 'tickets.xlsx');
```

### PDF (DomPDF)

```php
use Barryvdh\DomPDF\Facade\Pdf;

$pdf = Pdf::loadView('exports.tickets-pdf', ['tickets' => $tickets]);
return $pdf->download('tickets.pdf');
```

---

## 🚨 Errores Comunes en Rutas/Controladores

❌ **NO** validar en el controlador (usar FormRequest).  
❌ **NO** omitir middleware de permisos.  
❌ **NO** usar `Route::get(...)` sin `->name(...)`.  
❌ **NO** hardcodear IDs o slugs en rutas.  
❌ **NO** olvidar paginación (`->paginate(10)`).  
❌ **NO** olvidar eager loading.  
❌ **NO** devolver datos sensibles en `Inertia::render`.

✅ **SÍ** usar `Route::resource` cuando aplique.  
✅ **SÍ** nombrar todas las rutas.  
✅ **SÍ** agrupar middleware por permisos.  
✅ **SÍ** usar transacciones para operaciones múltiples.

---

**Siguiente**: [09-testing.md](09-testing.md) — Estrategia de testing.
