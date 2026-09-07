<?php

namespace App\Http\Controllers;

use App\Helpers\DemoHelper;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DemoController extends Controller
{
    /**
     * Roles disponibles en el 1-click demo login.
     * El slug coincide con el nombre del rol Spatie sembrado.
     */
    public const DEMO_ROLES = [
        'admin' => [
            'label' => 'Administrador',
            'email' => 'demo-admin@auxora.demo',
            'description' => 'Acceso total al sistema: tickets, clientes, técnicos, backups, configuración.',
            'color' => 'purple',
        ],
        'Coordinador' => [
            'label' => 'Coordinador',
            'email' => 'demo-coordinador@auxora.demo',
            'description' => 'Supervisión, asignación de tickets y gestión de repuestos.',
            'color' => 'blue',
        ],
        'support' => [
            'label' => 'Soporte técnico',
            'email' => 'demo-support@auxora.demo',
            'description' => 'Solo ve los tickets asignados a él. Puede agregar comentarios y cambiar estados.',
            'color' => 'green',
        ],
        'customer' => [
            'label' => 'Cliente',
            'email' => 'demo-customer@auxora.demo',
            'description' => 'Solo ve sus propios tickets y puede agregar comentarios.',
            'color' => 'amber',
        ],
    ];

    /**
     * Landing pública. Funciona siempre:
     * - Modo demo: muestra 1-click login por rol + registro público + banner.
     * - Sin modo demo: muestra solo el botón "Login con password".
     */
    public function welcome(): Response
    {
        $demoEnabled = DemoHelper::isEnabled();

        return Inertia::render('Welcome', [
            'demoEnabled' => $demoEnabled,
            'roles' => $demoEnabled
                ? collect(self::DEMO_ROLES)
                    ->reject(fn (array $r) => ! User::where('email', $r['email'])->exists())
                    ->map(fn (array $r, string $slug) => ['slug' => $slug] + $r)
                    ->values()
                    ->all()
                : [],
            'publicRegistration' => DemoHelper::publicRegistration(),
        ]);
    }

    /**
     * 1-click login: autentica al usuario demo del rol solicitado sin pedir
     * password. Solo funciona si el modo demo está activo y el usuario existe.
     * La sesión tiene un lifetime corto para minimizar el riesgo de hijacking.
     */
    public function loginAs(Request $request, string $role): RedirectResponse
    {
        abort_unless(DemoHelper::isEnabled(), 404);

        if (! isset(self::DEMO_ROLES[$role])) {
            abort(404, 'Rol demo desconocido.');
        }

        $user = User::where('email', self::DEMO_ROLES[$role]['email'])->first();
        abort_unless($user, 404, 'Usuario demo no encontrado. Ejecuta el seeder.');

        Auth::login($user, remember: false);
        $request->session()->regenerate();

        // Limitar la sesión de demo a 2 horas.
        config(['session.lifetime' => 120]);
        $request->session()->put('demo_session', true);

        return redirect()->intended(route('dashboard'));
    }
}