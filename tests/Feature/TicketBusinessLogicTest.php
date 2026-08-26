<?php

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    /** @var \Tests\TestCase $this */
    $this->seed(RolesAndPermissionsSeeder::class);

    // Comercial no está en el seeder — se crea aquí como en producción
    Role::firstOrCreate(['name' => 'Comercial']);
});

// ─────────────────────────────────────────────
// CERRAR TICKET: actualiza closed_at
// ─────────────────────────────────────────────

test('cerrar un ticket registra closed_at', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create([
        'customer_id' => $customer->id,
        'support_id'  => null,
        'status'      => 'Open',
        'closed_at'   => null,
    ]);

    $this->actingAs($admin)->patch(route('tickets.update-status', $ticket), [
        'status' => 'Closed',
    ]);

    $ticket->refresh();

    expect($ticket->status)->toBe('Closed')
        ->and($ticket->closed_at)->not->toBeNull();
});

test('reabrir un ticket limpia closed_at', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::factory()->create();
    $admin->assignRole('admin');

    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create([
        'customer_id' => $customer->id,
        'support_id'  => null,
        'status'      => 'Closed',
        'closed_at'   => now(),
    ]);

    $this->actingAs($admin)->patch(route('tickets.update-status', $ticket), [
        'status' => 'Open',
    ]);

    $ticket->refresh();

    expect($ticket->status)->toBe('Open')
        ->and($ticket->closed_at)->toBeNull();
});

// ─────────────────────────────────────────────
// TÉCNICO: solo puede cambiar estado, no editar campos
// ─────────────────────────────────────────────

test('técnico puede cambiar estado de ticket asignado a él', function () {
    /** @var \Tests\TestCase $this */
    $user    = User::factory()->create();
    $user->assignRole('support');

    $support  = Support::factory()->create(['email' => $user->email]);
    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create([
        'support_id'  => $support->id,
        'customer_id' => $customer->id,
        'status'      => 'Open',
    ]);

    $response = $this->actingAs($user)->patch(route('tickets.update-status', $ticket), [
        'status' => 'In Progress',
    ]);

    $response->assertRedirect();
    expect($ticket->fresh()->status)->toBe('In Progress');
});

test('técnico no puede cambiar estado de ticket no asignado a él', function () {
    /** @var \Tests\TestCase $this */
    $user    = User::factory()->create();
    $user->assignRole('support');

    // Soporte del usuario (no asignado al ticket)
    Support::factory()->create(['email' => $user->email]);

    $otherSupport = Support::factory()->create();
    $customer     = Customer::factory()->create();
    $ticket       = Ticket::factory()->create([
        'support_id'  => $otherSupport->id,
        'customer_id' => $customer->id,
        'status'      => 'Open',
    ]);

    $response = $this->actingAs($user)->patch(route('tickets.update-status', $ticket), [
        'status' => 'In Progress',
    ]);

    // updateStatus redirige de vuelta con error (no abort 403)
    $response->assertRedirect();
    $response->assertSessionHas('error');
    expect($ticket->fresh()->status)->toBe('Open');
});

// ─────────────────────────────────────────────
// PENDING PARTS: acceso por rol
// ─────────────────────────────────────────────

test('admin puede ver la vista de repuestos pendientes', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('pending-parts.index'));

    $response->assertOk();
});

test('cliente no puede crear repuesto pendiente', function () {
    /** @var \Tests\TestCase $this */
    $user = User::factory()->create();
    $user->assignRole('customer');

    $customer = Customer::factory()->create();
    $ticket   = Ticket::factory()->create(['customer_id' => $customer->id, 'support_id' => null]);

    $response = $this->actingAs($user)->post(route('pending-parts.store'), [
        'ticket_id' => $ticket->id,
        'part_name' => 'Fusor',
        'part_code' => 'FSR-001',
        'status'    => 'pending',
    ]);

    $response->assertStatus(403);
});

test('Comercial no puede crear repuesto pendiente', function () {
    /** @var \Tests\TestCase $this */
    $user = User::factory()->create();
    $user->assignRole('Comercial');

    $ticket = Ticket::factory()->create([
        'user_id'     => $user->id,
        'customer_id' => null,
        'support_id'  => null,
    ]);

    $response = $this->actingAs($user)->post(route('pending-parts.store'), [
        'ticket_id' => $ticket->id,
        'part_name' => 'Fusor',
        'part_code' => 'FSR-001',
        'status'    => 'pending',
    ]);

    $response->assertStatus(403);
});

// ─────────────────────────────────────────────
// DASHBOARD: acceso autenticado
// ─────────────────────────────────────────────

test('usuario autenticado puede acceder al dashboard', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('dashboard'));

    $response->assertOk();
});

test('invitado es redirigido al login desde el dashboard', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});
