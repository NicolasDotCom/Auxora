<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\DemoHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     *
     * - Modo demo: accesible para cualquiera (con rate limit + honeypot).
     * - Modo normal: solo admin puede registrar usuarios (controlado en routes).
     */
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'demoMode' => DemoHelper::isEnabled(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Honeypot: si el campo oculto viene relleno, es un bot.
        if ($request->filled('website')) {
            return back()->withErrors(['email' => 'Registro rechazado.'])->withInput();
        }

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'email.unique' => 'Ya existe una cuenta con ese email.',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // En modo demo, asignar rol "customer" por defecto (limitado).
        // En modo normal, NO asignar rol (lo hace un admin después).
        if (DemoHelper::isEnabled()) {
            $user->assignRole('customer');
        }

        event(new Registered($user));

        Auth::login($user);

        return to_route('dashboard');
    }
}
