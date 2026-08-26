<?php

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

beforeEach(function () {
    /** @var \Tests\TestCase $this */
    $this->seed(RolesAndPermissionsSeeder::class);

    Role::firstOrCreate(['name' => 'Comercial']);
});

// ─────────────────────────────────────────────
// CREAR TICKET: campos requeridos
// ─────────────────────────────────────────────

test('admin puede crear ticket con datos válidos', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'support_id'      => null,
        'subject'         => 'Manchas',
        'description'     => 'Descripción del problema',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet 1020',
        'serial'          => 'SN123456',
        'status'          => 'Open',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'customer_id' => $customer->id,
        'subject'     => 'Manchas',
        'status'      => 'Open',
    ]);
});

test('crear ticket falla si falta subject', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'description'     => 'Descripción del problema',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet 1020',
        'serial'          => 'SN123456',
        'status'          => 'Open',
    ]);

    $response->assertSessionHasErrors('subject');
});

test('crear ticket falla si falta description', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'subject'         => 'Manchas',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet 1020',
        'serial'          => 'SN123456',
        'status'          => 'Open',
    ]);

    $response->assertSessionHasErrors('description');
});

test('crear ticket falla si subject no está en el listado permitido', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'subject'         => 'SubjectInvalido',
        'description'     => 'Descripción',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet',
        'serial'          => 'SN001',
        'status'          => 'Open',
    ]);

    $response->assertSessionHasErrors('subject');
});

test('crear ticket falla si status no es válido', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'subject'         => 'Manchas',
        'description'     => 'Descripción',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet',
        'serial'          => 'SN001',
        'status'          => 'Invalido',
    ]);

    $response->assertSessionHasErrors('status');
});

// ─────────────────────────────────────────────
// SOLICITUD DE TONER: serial/marca/modelo opcionales
// ─────────────────────────────────────────────

test('Solicitud de Toner no requiere brand ni model ni serial', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'subject'         => 'Solicitud de Toner',
        'description'     => 'Necesito toner',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'status'          => 'Open',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'customer_id' => $customer->id,
        'subject'     => 'Solicitud de Toner',
    ]);
});

test('asunto distinto a Toner requiere brand, model y serial', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();

    $response = $this->actingAs($admin)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $customer->id,
        'subject'         => 'Manchas',
        'description'     => 'Manchas en papel',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'status'          => 'Open',
        // sin brand, model, serial
    ]);

    $response->assertSessionHasErrors(['brand', 'model', 'serial']);
});

// ─────────────────────────────────────────────
// CLIENTE: no puede crear ticket para otro customer
// ─────────────────────────────────────────────

test('cliente no puede crear ticket para otro customer_id', function () {
    /** @var \Tests\TestCase $this */
    $user = User::factory()->create();
    $user->assignRole('customer');

    Customer::factory()->create(['email' => $user->email]);
    $otherCustomer = Customer::factory()->create();

    $response = $this->actingAs($user)->post(route('tickets.store'), [
        'request_uuid'    => (string) Str::uuid(),
        'customer_id'     => $otherCustomer->id,
        'subject'         => 'Manchas',
        'description'     => 'Descripción',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet',
        'serial'          => 'SN001',
        'status'          => 'Open',
    ]);

    // Debe ser rechazado (redirect back con error)
    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('tickets', ['customer_id' => $otherCustomer->id]);
});

test('doble envío con el mismo request_uuid no crea tickets duplicados', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();
    $requestUuid = (string) Str::uuid();

    $payload = [
        'request_uuid'    => $requestUuid,
        'customer_id'     => $customer->id,
        'support_id'      => null,
        'subject'         => 'Manchas',
        'description'     => 'Descripción del problema',
        'phone'           => '3001234567',
        'nombre_contacto' => 'Juan Pérez',
        'address'         => 'Calle 123',
        'brand'           => 'HP',
        'model'           => 'LaserJet 1020',
        'serial'          => 'SN123456',
        'status'          => 'Open',
    ];

    $this->actingAs($admin)->post(route('tickets.store'), $payload)->assertRedirect();
    $this->actingAs($admin)->post(route('tickets.store'), $payload)->assertRedirect();

    expect(Ticket::where('user_id', $admin->id)->where('request_uuid', $requestUuid)->count())->toBe(1);
});
