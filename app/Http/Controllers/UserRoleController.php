<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserRoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('role:admin');
    }

    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = User::with('roles')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });

        // Si hay búsqueda activa, mostrar todos los resultados en una página
        if ($search) {
            $allUsers = $query->get();
            $users = new \Illuminate\Pagination\LengthAwarePaginator(
                $allUsers,
                $allUsers->count(),
                $allUsers->count(),
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        } else {
            $users = $query->paginate(10)->withQueryString();
        }

        $roles = Role::all();

        return Inertia::render('User/Roles', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        foreach ($validated['roles'] as $userId => $roleName) {
            $user = User::find($userId);
            if ($user) {
                $user->syncRoles([$roleName]);
            }
        }

        return redirect()
            ->route('users.roles.index')
            ->with('success', 'User roles updated successfully!');
    }
}
