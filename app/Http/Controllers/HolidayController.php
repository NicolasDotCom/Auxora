<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HolidayController extends Controller
{
    /**
     * Mostrar lista de días festivos
     */
    public function index()
    {
        $user = User::find(Auth::id());
        
        // Solo admin puede ver/gestionar días festivos
        if (!$user || !$user->hasRole('admin')) {
            abort(403, 'No tienes permisos para ver esta sección.');
        }

        $holidays = Holiday::orderBy('date', 'asc')->get();

        return Inertia::render('Settings/Holidays', [
            'holidays' => $holidays
        ]);
    }

    /**
     * Crear nuevo día festivo
     */
    public function store(Request $request)
    {
        $user = User::find(Auth::id());
        
        if (!$user || !$user->hasRole('admin')) {
            abort(403, 'No tienes permisos para realizar esta acción.');
        }

        $validated = $request->validate([
            'date' => 'required|date|unique:holidays,date',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        Holiday::create($validated);

        return redirect()->back()->with('success', 'Día festivo agregado correctamente.');
    }

    /**
     * Actualizar día festivo
     */
    public function update(Request $request, Holiday $holiday)
    {
        $user = User::find(Auth::id());
        
        if (!$user || !$user->hasRole('admin')) {
            abort(403, 'No tienes permisos para realizar esta acción.');
        }

        $validated = $request->validate([
            'date' => 'required|date|unique:holidays,date,' . $holiday->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $holiday->update($validated);

        // Limpiar caché de festivos
        \App\Services\CacheService::clearHolidaysCache();

        return redirect()->back()->with('success', 'Día festivo actualizado correctamente.');
    }

    /**
     * Eliminar día festivo
     */
    public function destroy(Holiday $holiday)
    {
        $user = User::find(Auth::id());
        
        if (!$user || !$user->hasRole('admin')) {
            abort(403, 'No tienes permisos para realizar esta acción.');
        }

        $holiday->delete();

        // Limpiar caché de festivos
        \App\Services\CacheService::clearHolidaysCache();

        return redirect()->back()->with('success', 'Día festivo eliminado correctamente.');
    }
}

