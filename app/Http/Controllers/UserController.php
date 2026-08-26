<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Support;
use App\Models\Customer;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('role:admin');
    }

    public function index(Request $request)
    {
        $nombre  = $request->query('nombre');
        $role    = $request->query('role');
        $nit     = $request->query('nit');
        $estado  = $request->query('estado'); // 'verified' | 'unverified'

        $query = User::select('id', 'name', 'email', 'email_verified_at', 'created_at')
            ->with(['roles:id,name', 'customer:id,email,name_user,nit'])
            ->when($nombre, fn($q) => $q->where('name', 'like', "%{$nombre}%"))
            ->when($role,   fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', $role)))
            ->when($nit,    fn($q) => $q->whereHas('customer', fn($c) => $c->where('nit', 'like', "%{$nit}%")))
            ->when($estado === 'verified',   fn($q) => $q->whereNotNull('email_verified_at'))
            ->when($estado === 'unverified', fn($q) => $q->whereNull('email_verified_at'));

        $users = $query->paginate(10)->withQueryString();

        $roles = Role::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        $companyNames = Customer::select('name')->distinct()->orderBy('name')->pluck('name');
        
        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'companyNames' => $companyNames,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6|confirmed',
                'role' => 'required|exists:roles,name',
                'phone' => 'nullable|string|max:20',
                'speciality' => 'nullable|in:Impresoras,Sistemas',
                'name_user' => 'nullable|string|max:255',
                'nit' => 'nullable|string|max:20',
                'additional_nits' => 'nullable|array',
                'additional_nits.*' => 'nullable|string|max:20',
                'ciudad' => 'required|string|max:255',
            ]);
            
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'ciudad' => $validated['ciudad'],
            ]);
            
            // Disparar el evento Registered para enviar el correo de verificación
            event(new Registered($user));
            
            $user->assignRole($validated['role']);
            
            // Si el rol es 'support', crear automáticamente un registro en la tabla supports
            if ($validated['role'] === 'support') {
                Support::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? '', // Usar el teléfono proporcionado o vacío
                    'speciality' => $validated['speciality'] ?? 'Sistemas', // Usar especialidad seleccionada o Sistemas por defecto
                ]);
            }
            
            // Si el rol es 'customer', crear automáticamente un registro en la tabla customers
            if ($validated['role'] === 'customer') {
                Customer::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'name_user' => $validated['name_user'] ?? $validated['name'], // Usar name_user proporcionado o el nombre como fallback
                    'phone' => $validated['phone'] ?? '',
                    'nit' => $validated['nit'] ?? null,
                    'additional_nits' => !empty($validated['additional_nits'])
                        ? array_values(array_filter($validated['additional_nits'], fn($n) => !empty(trim($n ?? ''))))
                        : null,
                ]);
            }
            
            $successMessage = 'Usuario creado exitosamente.';
            if ($validated['role'] === 'support') {
                $successMessage .= ' Se ha creado automáticamente el perfil de soporte técnico.';
            } elseif ($validated['role'] === 'customer') {
                $successMessage .= ' Se ha creado automáticamente el perfil de cliente.';
            }
            
            return redirect()
                ->route('users.index')
                ->with('success', $successMessage);
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Error al crear el usuario: ' . $e->getMessage());
        }
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        
        // Buscar si existe un soporte asociado con este email
        $support = Support::where('email', $user->email)->first();
        
        // Buscar si existe un customer asociado con este email
        $customer = Customer::where('email', $user->email)->first();
        
        return Inertia::render('Users/Edit', [
            'user' => $user->load('roles'),
            'roles' => $roles,
            'support' => $support,
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $user->id,
                'role' => 'required|exists:roles,name',
                'phone' => 'nullable|string|max:20',
                'speciality' => 'nullable|in:Impresoras,Sistemas',
                'name_user' => 'nullable|string|max:255',
                'nit' => 'nullable|string|max:20',
                'additional_nits' => 'nullable|array',
                'additional_nits.*' => 'nullable|string|max:20',
            ]);
            
            // Obtener el rol anterior y el email anterior
            $previousRole = $user->roles->first()->name ?? null;
            $previousEmail = $user->email;
            
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
            
            $user->syncRoles([$validated['role']]);
            
            // IMPORTANTE: Actualizar email en todas las tablas relacionadas (independientemente del rol)
            // Esto evita problemas de sincronización cuando un usuario tiene registros en múltiples tablas
            
            // Actualizar en tabla supports si existe un registro con el email anterior
            $existingSupport = Support::where('email', $previousEmail)->first();
            if ($existingSupport) {
                $existingSupport->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? $existingSupport->phone,
                    'speciality' => $validated['speciality'] ?? $existingSupport->speciality,
                ]);
            }
            
            // Actualizar en tabla customers si existe un registro con el email anterior
            $existingCustomer = Customer::where('email', $previousEmail)->first();
            if ($existingCustomer) {
                $existingCustomer->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'name_user' => $validated['name_user'] ?? $existingCustomer->name_user,
                    'phone' => $validated['phone'] ?? $existingCustomer->phone,
                    'nit' => $validated['nit'] ?? $existingCustomer->nit,
                    'additional_nits' => isset($validated['additional_nits'])
                        ? array_values(array_filter($validated['additional_nits'], fn($n) => !empty(trim($n ?? ''))))
                        : $existingCustomer->additional_nits,
                ]);
            }
            
            // Manejar cambios de rol relacionados con support
            if ($validated['role'] === 'support' && $previousRole !== 'support') {
                // Si cambió a support y no existe registro, crearlo
                if (!$existingSupport) {
                    Support::create([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? '',
                        'speciality' => $validated['speciality'] ?? 'Sistemas',
                    ]);
                }
            } elseif ($previousRole === 'support' && $validated['role'] !== 'support') {
                // Si dejó de ser support, eliminar registro de supports
                if ($existingSupport) {
                    $existingSupport->delete();
                }
            }
            
            // Manejar cambios de rol relacionados con customer
            if ($validated['role'] === 'customer' && $previousRole !== 'customer') {
                // Si cambió a customer y no existe registro, crearlo
                if (!$existingCustomer) {
                    Customer::create([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'name_user' => $validated['name_user'] ?? $validated['name'],
                        'phone' => $validated['phone'] ?? '',
                        'nit' => $validated['nit'] ?? null,
                        'additional_nits' => !empty($validated['additional_nits'])
                            ? array_values(array_filter($validated['additional_nits'], fn($n) => !empty(trim($n ?? ''))))
                            : null,
                    ]);
                }
            } elseif ($previousRole === 'customer' && $validated['role'] !== 'customer') {
                // Si dejó de ser customer, eliminar registro de customers
                if ($existingCustomer) {
                    $existingCustomer->delete();
                }
            }
            
            return redirect()
                ->route('users.index')
                ->with('success', 'Usuario actualizado exitosamente.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Error al actualizar el usuario: ' . $e->getMessage());
        }
    }

    public function destroy(User $user) {
        try {
            // Si el usuario tiene rol de support, eliminar también su registro de supports
            if ($user->hasRole('support')) {
                Support::where('email', $user->email)->delete();
            }
            
            // Si el usuario tiene rol de customer, eliminar también su registro de customers
            if ($user->hasRole('customer')) {
                Customer::where('email', $user->email)->delete();
            }
            
            $user->delete();

            return redirect()
                ->route('users.index')
                ->with('success', 'Usuario eliminado exitosamente.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Error al eliminar el usuario: ' . $e->getMessage());
        }
    }

    /**
     * Verificar manualmente el email de un usuario
     */
    public function verifyUser(User $user)
    {
        try {
            if ($user->email_verified_at) {
                return redirect()
                    ->back()
                    ->with('warning', 'Este usuario ya está verificado.');
            }

            // Marcar como verificado (igual que lo hace Laravel por email)
            if ($user->markEmailAsVerified()) {
                // Disparar el evento Verified para mantener consistencia
                event(new Verified($user));
            }

            return redirect()
                ->back()
                ->with('success', 'Usuario verificado exitosamente.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Error al verificar el usuario: ' . $e->getMessage());
        }
    }
}
