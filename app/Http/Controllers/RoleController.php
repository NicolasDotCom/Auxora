<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('role:admin');
    }

    public function index(Request $request)
    {
        $search = $request->query('search');

        // Optimización: Select específico
        $query = Role::select('id', 'name', 'guard_name', 'created_at')
            ->withCount('permissions')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");;
            });

        // Si hay búsqueda activa, mostrar todos los resultados en una página
        if ($search) {
            $allRoles = $query->get();
            $roles = new \Illuminate\Pagination\LengthAwarePaginator(
                $allRoles,
                $allRoles->count(),
                $allRoles->count(),
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        } else {
            $roles = $query->paginate(10)->withQueryString();
        }

        return Inertia::render('Roles/Index', [
            'roles' => $roles
        ]);
    }

    public function create()
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode(' ', $permission->name)[1];
        });

        return Inertia::render('Roles/Create' , [
            'permissions' => $permissions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role created successfully!');
    }

    public function edit(Role $role)
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode(' ', $permission->name)[1];
        });

        $rolePermissions = $role->permissions->pluck('name')->toArray();

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role permissions updated successfully!');
    }
}
