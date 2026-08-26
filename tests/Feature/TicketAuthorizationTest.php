<?php

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    /** @var \Tests\TestCase $this */
    $this->seed(RolesAndPermissionsSeeder::class);

    // Comercial no está en el seeder — se crea aquí como en producción
    $comercialRole = Role::firstOrCreate(['name' => 'Comercial']);
    $comercialRole->givePermissionTo([
        Permission::findOrCreate('view ticket'),
        Permission::findOrCreate('create ticket'),
    ]);
});

// ─────────────────────────────────────────────
// ACCESO A TICKET: rol customer
// ─────────────────────────────────────────────

test('cliente puede ver su propio ticket', function () {
    /** @var \Tests\TestCase $this */
    $user     = User::factory()->create();
    $user->assignRole('customer');

    $customer = Customer::factory()->create(['email' => $user->email]);
    $ticket   = Ticket::factory()->create(['customer_id' => $customer->id, 'support_id' => null]);

    $response = $this->actingAs($user)->get(route('tickets.show', $ticket));

    $response->assertOk();
});

test('cliente no puede ver ticket de otro cliente', function () {
    /** @var \Tests\TestCase $this */
    $user     = User::factory()->create();
    $user->assignRole('customer');

    $otherCustomer = Customer::factory()->create();
    $ticket        = Ticket::factory()->create(['customer_id' => $otherCustomer->id, 'support_id' => null]);

    // El usuario autenticado tiene su propio Customer (distinto al del ticket)
    Customer::factory()->create(['email' => $user->email]);

    $response = $this->actingAs($user)->get(route('tickets.show', $ticket));

    $response->assertStatus(403);
});

// ─────────────────────────────────────────────
// ACCESO A TICKET: rol support
// ─────────────────────────────────────────────

test('técnico puede ver ticket asignado a él', function () {
    /** @var \Tests\TestCase $this */
    $user    = User::factory()->create();
    $user->assignRole('support');

    $support  = Support::factory()->create(['email' => $user->email]);
    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create(['support_id' => $support->id, 'customer_id' => $customer->id]);

    $response = $this->actingAs($user)->get(route('tickets.show', $ticket));

    $response->assertOk();
});

test('técnico no puede ver ticket asignado a otro técnico', function () {
    /** @var \Tests\TestCase $this */
    $user    = User::factory()->create();
    $user->assignRole('support');

    Support::factory()->create(['email' => $user->email]);

    $otherSupport = Support::factory()->create();
    $customer     = Customer::factory()->create();
    $ticket       = Ticket::factory()->create(['support_id' => $otherSupport->id, 'customer_id' => $customer->id]);

    $response = $this->actingAs($user)->get(route('tickets.show', $ticket));

    $response->assertStatus(403);
});

// ─────────────────────────────────────────────
// ACCESO A TICKET: rol admin
// ─────────────────────────────────────────────

test('admin puede ver cualquier ticket', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create(['customer_id' => $customer->id, 'support_id' => null]);

    $response = $this->actingAs($admin)->get(route('tickets.show', $ticket));

    $response->assertOk();
});

// ─────────────────────────────────────────────
// ACCESO A TICKET: rol Comercial
// ─────────────────────────────────────────────

test('comercial solo puede ver tickets que él creó', function () {
    /** @var \Tests\TestCase $this */
    $comercial = User::factory()->create();
    $comercial->assignRole('Comercial');

    $ticket = Ticket::factory()->create([
        'user_id'         => $comercial->id,
        'customer_id'     => null,
        'support_id'      => null,
        'cliente_externo' => 'Empresa X',
    ]);

    $response = $this->actingAs($comercial)->get(route('tickets.show', $ticket));

    $response->assertOk();
});

test('comercial no puede ver ticket creado por otro usuario', function () {
    /** @var \Tests\TestCase $this */
    $comercial = User::factory()->create();
    $comercial->assignRole('Comercial');

    $otroUsuario = User::factory()->create();
    $customer    = Customer::factory()->create();
    $ticket      = Ticket::factory()->create([
        'user_id'     => $otroUsuario->id,
        'customer_id' => $customer->id,
        'support_id'  => null,
    ]);

    $response = $this->actingAs($comercial)->get(route('tickets.show', $ticket));

    $response->assertStatus(403);
});

// ─────────────────────────────────────────────
// ACCESO SIN AUTENTICACIÓN
// ─────────────────────────────────────────────

test('usuario no autenticado es redirigido al login al intentar ver ticket', function () {
    /** @var \Tests\TestCase $this */
    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create(['customer_id' => $customer->id, 'support_id' => null]);

    $response = $this->get(route('tickets.show', $ticket));

    $response->assertRedirect(route('login'));
});

// ─────────────────────────────────────────────
// LISTADO DE TICKETS: solo ve los propios
// ─────────────────────────────────────────────

test('listado de tickets de cliente solo muestra sus tickets', function () {
    /** @var \Tests\TestCase $this */
    $user     = User::factory()->create();
    $user->assignRole('customer');

    $customer      = Customer::factory()->create(['email' => $user->email]);
    $otherCustomer = Customer::factory()->create();

    Ticket::factory()->create(['customer_id' => $customer->id, 'support_id' => null, 'description' => 'Mi ticket']);
    Ticket::factory()->create(['customer_id' => $otherCustomer->id, 'support_id' => null, 'description' => 'Ticket ajeno']);

    $response = $this->actingAs($user)->get(route('tickets.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) =>
        $page->has('tickets.data', 1)
    );
});

test('admin puede acceder a duplicar ticket', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();
    $ticket = Ticket::factory()->create([
        'customer_id' => $customer->id,
        'support_id' => null,
    ]);

    $response = $this->actingAs($admin)->get(route('tickets.duplicate', $ticket));

    $response->assertRedirect(route('tickets.create', ['from_ticket' => $ticket->id]));
});

test('comercial no puede duplicar ticket creado por otro usuario', function () {
    /** @var \Tests\TestCase $this */
    $comercial = User::factory()->create();
    $comercial->assignRole('Comercial');

    $otroUsuario = User::factory()->create();
    $customer = Customer::factory()->create();
    $ticket = Ticket::factory()->create([
        'user_id' => $otroUsuario->id,
        'customer_id' => $customer->id,
        'support_id' => null,
    ]);

    $response = $this->actingAs($comercial)->get(route('tickets.create', ['from_ticket' => $ticket->id]));

    $response->assertStatus(403);
});
