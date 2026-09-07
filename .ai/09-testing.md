# 🧪 09 — Estrategia de Testing

## 🎯 Stack de Testing

- **[Pest 4](https://pestphp.com/)** — Framework principal (sintaxis elegante sobre PHPUnit).
- **PHPUnit 11** — Base.
- **Mockery** — Para mocks de clases.
- **FakerPHP** — Generación de datos fake.

---

## 📁 Estructura

```
tests/
├── Pest.php                 # Configuración global de Pest
├── TestCase.php             # Clase base (RefreshDatabase, etc.)
├── Feature/                 # Tests end-to-end
│   ├── Auth/
│   │   ├── AuthenticationTest.php
│   │   ├── EmailVerificationTest.php
│   │   ├── PasswordConfirmationTest.php
│   │   ├── PasswordResetTest.php
│   │   └── RegistrationTest.php
│   ├── Settings/
│   │   ├── PasswordUpdateTest.php
│   │   └── ProfileUpdateTest.php
│   ├── DashboardTest.php
│   ├── TicketAuthorizationTest.php
│   ├── TicketBusinessLogicTest.php
│   └── TicketValidationTest.php
└── Unit/
    └── ExampleTest.php
```

---

## ⚙️ Configuración

### `tests/Pest.php`

```php
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->in('Feature');
uses()->in('Unit');

// Helpers compartidos
expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
```

### `tests/TestCase.php`

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
}
```

---

## 🏭 Factories

### Ubicación: `database/factories/`

Factories disponibles:
- `UserFactory.php`
- `CustomerFactory.php`
- `SupportFactory.php`
- `TicketFactory.php`
- `TicketDocumentFactory.php`

### Uso en Tests

```php
// Crear un modelo
$user = User::factory()->create();

// Crear varios
$users = User::factory()->count(5)->create();

// Con atributos específicos
$ticket = Ticket::factory()->create([
    'status' => 'Open',
    'customer_id' => $customer->id,
]);

// Con relaciones
$ticket = Ticket::factory()
    ->for($customer)
    ->for($support, 'support')
    ->create();

// Estados (definidos en factory)
$closedTicket = Ticket::factory()->closed()->create();
```

---

## ✅ Tipos de Tests

### 1. Feature Tests (Integración)

Verifican flujos completos (HTTP → Controller → DB).

```php
<?php

use App\Models\User;
use App\Models\Ticket;
use App\Models\Customer;

test('admin can view all tickets', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $ticket = Ticket::factory()->create();

    $response = $this->actingAs($admin)
        ->get(route('tickets.index'));

    $response->assertOk();
    $response->assertSee($ticket->subject);
});

test('support user only sees assigned tickets', function () {
    $support = Support::factory()->create();
    $user = User::factory()->create(['email' => $support->email])
        ->assignRole('support');

    $myTicket = Ticket::factory()->create(['support_id' => $support->id]);
    $otherTicket = Ticket::factory()->create();  // Asignado a otro

    $response = $this->actingAs($user)
        ->get(route('tickets.index'));

    $response->assertOk();
    $response->assertSee($myTicket->subject);
    $response->assertDontSee($otherTicket->subject);
});
```

### 2. Unit Tests (Unidad)

Verifican lógica pura sin Laravel (o con un subset).

```php
<?php

use App\Helpers\WorkingDaysHelper;
use Carbon\Carbon;

test('working days excludes sundays and holidays', function () {
    $start = Carbon::parse('2026-01-05'); // Lunes
    $end = Carbon::parse('2026-01-09');   // Viernes

    $workingDays = WorkingDaysHelper::getWorkingDays($start, $end);

    expect($workingDays)->toBe(5);
});

test('working days handles reversed dates', function () {
    $start = Carbon::parse('2026-01-09');
    $end = Carbon::parse('2026-01-05');

    $workingDays = WorkingDaysHelper::getWorkingDays($start, $end);

    expect($workingDays)->toBe(0);
});
```

---

## 🎯 Patrones Comunes

### Autenticación en Tests

```php
// ✅ Acting as (no requiere login completo)
$response = $this->actingAs($user)->get('/dashboard');

// ✅ Como admin
$admin = User::factory()->create();
$admin->assignRole('admin');
$this->actingAs($admin);

// ✅ Como guest
$response = $this->get('/login');
```

### Asignar Roles

```php
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});
```

### Validación

```php
test('ticket creation requires subject', function () {
    $user = User::factory()->create()->assignRole('admin');

    $response = $this->actingAs($user)
        ->post(route('tickets.store'), [
            'description' => 'Sin subject',
        ]);

    $response->assertSessionHasErrors(['subject']);
});

test('ticket subject must be valid enum', function () {
    $user = User::factory()->create()->assignRole('admin');

    $response = $this->actingAs($user)
        ->post(route('tickets.store'), [
            'subject' => 'INVALID_VALUE',
            'description' => 'Test',
        ]);

    $response->assertSessionHasErrors(['subject']);
});
```

### Autorización

```php
test('customer cannot delete tickets', function () {
    $customer = Customer::factory()->create();
    $user = User::factory()->create(['email' => $customer->email])
        ->assignRole('customer');
    $ticket = Ticket::factory()->create(['customer_id' => $customer->id]);

    $response = $this->actingAs($user)
        ->delete(route('tickets.destroy', $ticket));

    $response->assertForbidden();  // 403
});

test('support cannot access customer management', function () {
    $user = User::factory()->create()->assignRole('support');

    $response = $this->actingAs($user)
        ->get(route('customers.index'));

    $response->assertForbidden();
});
```

### Base de Datos

```php
// ✅ RefreshDatabase automático (vía Pest.php uses)
// Crea transaccion y rollbackea por test

// ✅ Crear datos específicos
$customer = Customer::factory()->create();
$ticket = Ticket::factory()->for($customer)->create();

// ✅ Sin tocar BD (pure)
test('helper works', function () {
    expect(WorkingDaysHelper::isWorkingDay(Carbon::parse('2026-01-05')))
        ->toBeTrue();
});
```

### Mocking

```php
use Illuminate\Support\Facades\Mail;

test('sends email when ticket is created', function () {
    Mail::fake();

    $user = User::factory()->create()->assignRole('admin');

    $this->actingAs($user)
        ->post(route('tickets.store'), [
            'subject' => 'Soporte',
            'description' => 'Test',
        ]);

    Mail::assertSent(TicketCreatedMail::class);
});
```

---

## 🧰 Helpers Pest Personalizados

### Definir en `tests/Pest.php`

```php
// Helper para crear admin
function createAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');
    return $user;
}

// Helper para crear ticket con todo
function createTicket(array $overrides = []): Ticket
{
    return Ticket::factory()->create($overrides);
}

// Uso
test('test', function () {
    $admin = createAdmin();
    $ticket = createTicket(['status' => 'Closed']);
    // ...
});
```

---

## 🏃 Ejecutar Tests

```bash
# Todos los tests
php artisan test

# O con Pest directo
./vendor/bin/pest

# Tests específicos
php artisan test --filter=TicketAuthorizationTest
php artisan test tests/Feature/TicketValidationTest.php

# Con cobertura
php artisan test --coverage

# Solo Feature
php artisan test --testsuite=Feature

# Solo Unit
php artisan test --testsuite=Unit

# Verbose
php artisan test -v
```

---

## ✅ Tests Existentes del Proyecto

| Archivo | Cubre |
|---------|-------|
| `Auth/AuthenticationTest.php` | Login, logout |
| `Auth/EmailVerificationTest.php` | Verificación de email |
| `Auth/PasswordConfirmationTest.php` | Confirmación de password |
| `Auth/PasswordResetTest.php` | Reset de contraseña |
| `Auth/RegistrationTest.php` | Registro |
| `Settings/PasswordUpdateTest.php` | Cambio de password |
| `Settings/ProfileUpdateTest.php` | Edición de perfil |
| `DashboardTest.php` | Acceso al dashboard |
| `TicketAuthorizationTest.php` | Permisos por rol en tickets |
| `TicketBusinessLogicTest.php` | Lógica de negocio (estados, asignaciones) |
| `TicketValidationTest.php` | Validación de Form Requests |

---

## 🎯 Cobertura Mínima Recomendada

- ✅ **Autorización por rol** en cada recurso (CRUD).
- ✅ **Validación** de Form Requests (campos required, enums, tipos).
- ✅ **Lógica de visibilidad** (qué ve cada rol).
- ✅ **Casos borde** (sin datos, con muchos datos, IDs inexistentes).
- ✅ **Mutaciones de caché** (al crear, se invalida).

---

## 🚨 Errores Comunes en Tests

❌ **NO** olvidar `RefreshDatabase` (tests contaminados).  
❌ **NO** usar datos hardcoded (usar factories).  
❌ **NO** depender del orden de ejecución.  
❌ **NO** hacer tests que dependan de otros tests.  
❌ **NO** olvidar `$this->actingAs($user)` antes de acceder a rutas protegidas.  
❌ **NO** testear detalles de implementación (testear comportamiento).

✅ **SÍ** un test = un comportamiento.  
✅ **SÍ** nombres descriptivos (`test admin can delete tickets`).  
✅ **SÍ** usar factories para datos realistas.  
✅ **SÍ** limpiar caché entre tests si es relevante.  
✅ **SÍ** mockear servicios externos (Mail, Storage).

---

## 📊 Reporte de Cobertura

```bash
php artisan test --coverage --min=70
```

Esto falla si la cobertura es <70%. Configurable en `phpunit.xml`.

---

**Siguiente**: [10-common-patterns.md](10-common-patterns.md) — Patrones recurrentes.
