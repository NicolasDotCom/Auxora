
# 💡 Ejemplos Prácticos End-to-End

> Esta guía muestra **ejemplos completos** de features comunes en el proyecto, aplicando TODAS las buenas prácticas documentadas.

---

## 🪣 Ejemplo 0: Subir y Gestionar Archivos en S3 (Laravel Cloud)

Como el proyecto corre en Laravel Cloud con bucket S3, **todos los archivos deben subirse a S3** (no disco local en producción).

### Controller con Subida Múltiple a S3

```php
<?php
// app/Http/Controllers/TicketDocumentController.php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TicketDocumentController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view ticket')->only(['index']);
        $this->middleware('permission:edit ticket')->only(['store', 'destroy']);
    }

    public function store(Request $request, Ticket $ticket)
    {
        $request->validate([
            'documents'   => ['required', 'array', 'max:10'],
            'documents.*' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'], // 10MB
        ]);

        DB::transaction(function () use ($request, $ticket) {
            foreach ($request->file('documents') as $file) {
                // ✅ Nombre único para evitar colisiones en S3
                $uniqueName = Str::uuid() . '-' . $file->getClientOriginalName();

                // ✅ Subir a S3 (Laravel Cloud)
                $path = $file->storeAs(
                    "ticket-documents/{$ticket->id}",
                    $uniqueName,
                    config('filesystems.default')  // = 's3' en producción
                );

                $ticket->documents()->create([
                    'file_name'   => $file->getClientOriginalName(),
                    'file_path'   => $path,
                    'file_type'   => $file->getMimeType(),
                    'file_size'   => $file->getSize(),
                    'uploaded_by' => auth()->id(),
                ]);
            }

            // Auditoría
            $ticket->histories()->create([
                'user_id'     => auth()->id(),
                'action'      => 'documents_added',
                'description' => count($request->file('documents')) . ' documento(s) agregado(s)',
            ]);
        });

        return back()->with('success', 'Documentos subidos correctamente');
    }

    public function destroy(TicketDocument $document)
    {
        $this->authorizeAccess($document->ticket);

        DB::transaction(function () use ($document) {
            // ✅ Eliminar de S3 primero
            Storage::disk(config('filesystems.default'))->delete($document->file_path);

            // Luego eliminar registro
            $document->delete();
        });

        return back()->with('success', 'Documento eliminado');
    }

    private function authorizeAccess(Ticket $ticket): void
    {
        // Misma lógica de visibilidad que TicketController
        $user = auth()->user();
        if ($user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            abort_unless($support && $ticket->support_id === $support->id, 403);
        }
        // ... otros roles
    }
}
```

### Descargar con URL Temporal

```php
public function download(TicketDocument $document)
{
    $this->authorizeAccess($document->ticket);

    // Verificar que existe en S3
    if (!Storage::disk(config('filesystems.default'))->exists($document->file_path)) {
        abort(404, 'Archivo no encontrado');
    }

    // Si es S3, generar URL temporal (5 min) — más seguro
    if (config('filesystems.default') === 's3') {
        $tempUrl = Storage::disk('s3')->temporaryUrl(
            $document->file_path,
            now()->addMinutes(5)
        );
        return redirect($tempUrl);
    }

    // Si es local, descarga directa
    return Storage::disk('local')->download($document->file_path, $document->file_name);
}
```

### React: Subir con Preview

```tsx
// resources/js/components/ticket-upload.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export function TicketUpload({ ticketId }: { ticketId: number }) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);

        const formData = new FormData();
        files.forEach((file) => formData.append('documents[]', file));

        // ⚠️ En el proyecto real, los documentos se suben vía TicketController@update
        // o un endpoint dedicado. El ejemplo muestra el patrón genérico de Inertia.
        router.post(route('tickets.update', ticketId), formData, {
            forceFormData: true,
            onSuccess: () => {
                setFiles([]);
                toast.success('Documentos subidos');
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string);
            },
            onFinish: () => setUploading(false),
        });
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm"
            />

            {files.length > 0 && (
                <ul className="text-sm space-y-1">
                    {files.map((file, i) => (
                        <li key={i} className="flex justify-between">
                            <span>{file.name}</span>
                            <span className="text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
                {uploading ? 'Subiendo...' : `Subir ${files.length} archivo(s)`}
            </Button>
        </div>
    );
}
```

### Comandos Post-Deploy para Storage

```bash
# Después de cada deploy a Laravel Cloud:

# 1. Si acabas de activar S3 y tienes archivos en local
php artisan files:migrate-to-s3 --dry-run    # Simular primero
php artisan files:migrate-to-s3                # Ejecutar real

# 2. Backup semanal de documentos (programar en routes/console.php)
php artisan documents:backup

# 3. Verificar que S3 funciona
php artisan tinker
> Storage::disk('s3')->url('test.txt')
> Storage::disk('s3')->put('test.txt', 'Hola')
> Storage::disk('s3')->exists('test.txt')
> Storage::disk('s3')->delete('test.txt')
```

> 📚 Más detalles en `13-storage-s3-bucket.md`.

---

## 📦 Ejemplo 1: CRUD Completo para "Proveedores" (Suppliers)

Feature nueva: gestión de proveedores (entidades que surten repuestos).

### 📁 Archivos a crear/modificar

```
database/
  migrations/
    2026_02_01_000000_create_suppliers_table.php
  factories/
    SupplierFactory.php
app/
  Models/
    Supplier.php
  Http/
    Controllers/
      SupplierController.php
    Requests/
      StoreSupplierRequest.php
      UpdateSupplierRequest.php
  Services/
    CacheService.php             # Agregar métodos
database/seeders/
  RolesAndPermissionsSeeder.php # Agregar permisos
routes/
  web.php                       # Agregar rutas
resources/js/
  pages/
    Suppliers/
      Index.tsx
      Create.tsx
      Edit.tsx
tests/Feature/
  SupplierTest.php
```

---

### 1. Migración

```php
<?php
// database/migrations/2026_02_01_000000_create_suppliers_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('contact_name', 200)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('nit', 50)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('email');
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
```

### 2. Modelo

```php
<?php
// app/Models/Supplier.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'contact_name', 'email',
        'phone', 'address', 'nit', 'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        return $this->contact_name
            ? "{$this->name} ({$this->contact_name})"
            : $this->name;
    }
}
```

### 3. Factory

```php
<?php
// database/factories/SupplierFactory.php
namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'contact_name' => $this->faker->name(),
            'email' => $this->faker->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'nit' => $this->faker->unique()->numerify('########-#'),
            'active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn() => ['active' => false]);
    }
}
```

### 4. Form Requests

```php
<?php
// app/Http/Requests/StoreSupplierRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create supplier');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'contact_name' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email', 'max:150', 'unique:suppliers,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'nit' => ['nullable', 'string', 'max:50', 'unique:suppliers,nit'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del proveedor es obligatorio',
            'email.email' => 'El email no es válido',
            'email.unique' => 'Ya existe un proveedor con este email',
            'nit.unique' => 'Ya existe un proveedor con este NIT',
        ];
    }
}
```

```php
<?php
// app/Http/Requests/UpdateSupplierRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('edit supplier');
    }

    public function rules(): array
    {
        $supplierId = $this->route('supplier')->id;

        return [
            'name' => ['required', 'string', 'max:200'],
            'contact_name' => ['nullable', 'string', 'max:200'],
            'email' => [
                'nullable', 'email', 'max:150',
                Rule::unique('suppliers', 'email')->ignore($supplierId),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'nit' => [
                'nullable', 'string', 'max:50',
                Rule::unique('suppliers', 'nit')->ignore($supplierId),
            ],
            'active' => ['boolean'],
        ];
    }
}
```

### 5. Service Extension

```php
<?php
// app/Services/CacheService.php — AGREGAR métodos

public static function getSuppliersList()
{
    return Cache::remember('suppliers_list', self::DEFAULT_TTL, function () {
        return Supplier::select('id', 'name', 'contact_name', 'email')
            ->where('active', true)
            ->orderBy('name')
            ->get();
    });
}

public static function clearSuppliersCache()
{
    Cache::forget('suppliers_list');
}
```

### 6. Controlador

```php
<?php
// app/Http/Controllers/SupplierController.php
namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view supplier')
            ->only(['index', 'show']);
        $this->middleware('permission:create supplier')
            ->only(['create', 'store']);
        $this->middleware('permission:edit supplier')
            ->only(['edit', 'update']);
        $this->middleware('permission:delete supplier')
            ->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Supplier::query()
            ->select('id', 'name', 'contact_name', 'email', 'phone', 'active', 'created_at');

        // Filtros
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nit', 'like', "%{$search}%");
            });
        }

        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $suppliers = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'active']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Suppliers/Create');
    }

    public function store(StoreSupplierRequest $request)
    {
        Supplier::create($request->validated());
        CacheService::clearSuppliersCache();

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Proveedor creado correctamente');
    }

    public function show(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($request->validated());
        CacheService::clearSuppliersCache();

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Proveedor actualizado');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        CacheService::clearSuppliersCache();

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Proveedor eliminado');
    }
}
```

### 7. Permisos (Seeder)

```php
// database/seeders/RolesAndPermissionsSeeder.php — AGREGAR

$entitiesPermissions = [
    // ... existentes
    'supplier' => ['view', 'create', 'edit', 'delete'],
];

$rolesPermissions = [
    'admin' => Permission::all()->pluck('name')->toArray(),

    'Coordinador' => [
        // ... existentes
        'view supplier',
        'create supplier',
        'edit supplier',
    ],

    // ... otros roles
];
```

### 8. Rutas

```php
// routes/web.php — AGREGAR dentro del grupo auth

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('suppliers', SupplierController::class);
});
```

### 9. Página React (Index)

```tsx
// resources/js/pages/Suppliers/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { type Supplier, type Paginated } from '@/types';

interface Props {
    suppliers: Paginated<Supplier>;
    filters: { search?: string; active?: boolean };
}

export default function SuppliersIndex({ suppliers, filters }: Props) {
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('suppliers.index'), { search }, { preserveState: true });
    };

    const toggleActive = (supplier: Supplier) => {
        router.patch(
            route('suppliers.update', supplier.id),
            { ...supplier, active: !supplier.active },
            { preserveScroll: true }
        );
    };

    return (
        <AppLayout>
            <Head title="Proveedores" />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Proveedores</h1>
                {hasPermission('create supplier') && (
                    <Button asChild>
                        <Link href={route('suppliers.create')}>+ Nuevo Proveedor</Link>
                    </Button>
                )}
            </div>

            <Card className="mb-4">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Buscar por nombre, email o NIT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit">Buscar</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.data.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_name ?? '—'}</TableCell>
                                    <TableCell>{supplier.email ?? '—'}</TableCell>
                                    <TableCell>{supplier.phone ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.active ? 'default' : 'secondary'}>
                                            {supplier.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {hasPermission('edit supplier') && (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={route('suppliers.edit', supplier.id)}>
                                                        Editar
                                                    </Link>
                                                </Button>
                                            )}
                                            {hasPermission('delete supplier') && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar?')) {
                                                            router.delete(route('suppliers.destroy', supplier.id));
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
```

### 10. Tests

```php
<?php
// tests/Feature/SupplierTest.php

use App\Models\User;
use App\Models\Supplier;

beforeEach(function () {
    $this->admin = User::factory()->create()->assignRole('admin');
});

test('admin can view suppliers list', function () {
    Supplier::factory()->count(3)->create();

    $response = $this->actingAs($this->admin)
        ->get(route('suppliers.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Suppliers/Index'));
});

test('admin can create supplier', function () {
    $data = [
        'name' => 'ACME Corp',
        'email' => 'contact@acme.com',
        'phone' => '555-1234',
        'active' => true,
    ];

    $response = $this->actingAs($this->admin)
        ->post(route('suppliers.store'), $data);

    $response->assertRedirect(route('suppliers.index'));
    expect(Supplier::where('name', 'ACME Corp'))->toHaveCount(1);
});

test('supplier email must be unique', function () {
    Supplier::factory()->create(['email' => 'test@example.com']);

    $response = $this->actingAs($this->admin)
        ->post(route('suppliers.store'), [
            'name' => 'Otro',
            'email' => 'test@example.com',
        ]);

    $response->assertSessionHasErrors(['email']);
});

test('support cannot manage suppliers', function () {
    $support = User::factory()->create()->assignRole('support');

    $response = $this->actingAs($support)
        ->get(route('suppliers.index'));

    $response->assertForbidden();
});

test('cache is cleared when supplier is created', function () {
    CacheService::getSuppliersList(); // Populate cache

    $this->actingAs($this->admin)->post(route('suppliers.store'), [
        'name' => 'New Supplier',
    ]);

    expect(Cache::has('suppliers_list'))->toBeFalse();
});
```

---

## 📊 Ejemplo 2: Endpoint de Reporte Personalizado

Feature: Reporte de "Tickets por Ciudad" con exportación a Excel.

### Controller Method

```php
<?php
// app/Http/Controllers/DashboardController.php — AGREGAR

public function ticketsByCity(Request $request)
{
    $this->middleware('permission:stats analytics');

    $data = $request->validate([
        'date_from' => ['nullable', 'date'],
        'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
    ]);

    $cacheKey = 'tickets_by_city:' . md5(serialize($data));

    $stats = CacheService::getTechnicianRankingStats($cacheKey, function () use ($data) {
        $query = Ticket::query()
            ->select('ciudad', 'status', DB::raw('count(*) as total'))
            ->whereNotNull('ciudad')
            ->groupBy('ciudad', 'status');

        if (!empty($data['date_from'])) {
            $query->where('created_at', '>=', $data['date_from']);
        }
        if (!empty($data['date_to'])) {
            $query->where('created_at', '<=', $data['date_to']);
        }

        return $query->get()
            ->groupBy('ciudad')
            ->map(fn($group) => [
                'total' => $group->sum('total'),
                'open' => $group->where('status', 'Open')->sum('total'),
                'in_progress' => $group->where('status', 'In Progress')->sum('total'),
                'closed' => $group->where('status', 'Closed')->sum('total'),
            ])
            ->sortByDesc('total')
            ->values();
    });

    if ($request->wantsJson()) {
        return response()->json(['stats' => $stats]);
    }

    return Inertia::render('Analytics/TicketsByCity', [
        'stats' => $stats,
        'filters' => $data,
    ]);
}

public function exportTicketsByCityExcel(Request $request)
{
    $this->middleware('permission:export analytics');

    $data = $request->validate([
        'date_from' => ['nullable', 'date'],
        'date_to' => ['nullable', 'date'],
    ]);

    return Excel::download(
        new TicketsByCityExport($data),
        'tickets-por-ciudad-' . now()->format('Y-m-d') . '.xlsx'
    );
}
```

### Export Class

```php
<?php
// app/Exports/TicketsByCityExport.php

namespace App\Exports;

use App\Models\Ticket;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TicketsByCityExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function __construct(private array $filters) {}

    public function collection()
    {
        $query = Ticket::query()
            ->select(
                'ciudad',
                DB::raw("SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open"),
                DB::raw("SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress"),
                DB::raw("SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed"),
                DB::raw('count(*) as total'),
            )
            ->whereNotNull('ciudad')
            ->groupBy('ciudad')
            ->orderByDesc('total');

        if (!empty($this->filters['date_from'])) {
            $query->where('created_at', '>=', $this->filters['date_from']);
        }
        if (!empty($this->filters['date_to'])) {
            $query->where('created_at', '<=', $this->filters['date_to']);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return ['Ciudad', 'Abiertos', 'En Progreso', 'Cerrados', 'Total'];
    }

    public function map($row): array
    {
        return [
            $row->ciudad,
            $row->open,
            $row->in_progress,
            $row->closed,
            $row->total,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
```

### Ruta

```php
// routes/web.php
Route::middleware('permission:stats analytics')->group(function () {
    Route::get('/analytics/tickets-by-city', [DashboardController::class, 'ticketsByCity'])
        ->name('analytics.tickets-by-city');
    Route::get('/analytics/tickets-by-city/export', [DashboardController::class, 'exportTicketsByCityExcel'])
        ->name('analytics.tickets-by-city.export');
});
```

---

## 🎨 Ejemplo 3: Componente Reutilizable de Selector con Búsqueda

### Componente

```tsx
// resources/js/components/ui/combobox-search.tsx
import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

export interface ComboboxItem {
    value: string | number;
    label: string;
    description?: string;
}

interface ComboboxSearchProps {
    items: ComboboxItem[];
    value?: string | number;
    onChange: (value: string | number | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    clearable?: boolean;
}

export function ComboboxSearch({
    items,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'Sin resultados',
    disabled = false,
    clearable = true,
}: ComboboxSearchProps) {
    const [open, setOpen] = useState(false);

    const selected = useMemo(
        () => items.find((item) => item.value === value),
        [items, value]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between"
                >
                    {selected ? selected.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {clearable && selected && (
                                <CommandItem
                                    onSelect={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="text-muted-foreground italic"
                                >
                                    <span>Limpiar selección</span>
                                </CommandItem>
                            )}
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onChange(item.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === item.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        {item.description && (
                                            <span className="text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
```

### Uso en una Página

```tsx
// resources/js/pages/Tickets/Create.tsx (extracto)

import { ComboboxSearch } from '@/components/ui/combobox-search';

const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    description: c.email,
}));

const { data, setData } = useForm({ customer_id: '' as number | '' });

<ComboboxSearch
    items={customerOptions}
    value={data.customer_id}
    onChange={(value) => setData('customer_id', value as number | '')}
    placeholder="Selecciona un cliente"
    searchPlaceholder="Buscar cliente..."
/>
```

---

## 🎯 Resumen de Aplicación de Buenas Prácticas

En estos 3 ejemplos se aplicaron:

- ✅ **Migraciones con índices** y `down()`.
- ✅ **Modelos con `$fillable`, casts, scopes, accessors**.
- ✅ **Soft deletes** donde aplica.
- ✅ **Factories con estados**.
- ✅ **Form Requests separados** (Store + Update).
- ✅ **Controladores delgados** con constructor + middleware.
- ✅ **Eager loading y select específico** en queries.
- ✅ **CacheService** para datos frecuentes.
- ✅ **Invalidación de caché** al mutar.
- ✅ **Permisos granulares** en constructores y rutas.
- ✅ **Convencional commits** implícito en la organización.
- ✅ **Tests Pest** con factories + assertions semánticas.
- ✅ **Componentes UI reutilizables** con Radix + Tailwind.
- ✅ **TypeScript estricto** con interfaces explícitas.
- ✅ **useForm de Inertia** para formularios.
- ✅ **usePermissions** para mostrar/ocultar UI.

---

**Estos ejemplos sirven como plantilla para CUALQUIER feature nueva en el proyecto.**
