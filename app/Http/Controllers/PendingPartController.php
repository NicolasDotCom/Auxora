<?php

namespace App\Http\Controllers;

use App\Models\PendingPart;
use App\Models\Customer;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PendingPartController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Bloquear acceso a roles Comercial y customer
        abort_if(
            $user->hasRole('Comercial') || $user->hasRole('customer'),
            403,
            'No tienes permiso para acceder a esta sección.'
        );

        // Solo traer repuestos cuyo ticket tenga cliente asociado (filtro en DB, no en PHP)
        $pendingParts = PendingPart::with([
                'ticket:id,brand,model,serial,address,customer_id',
                'ticket.customer:id,name',
                'user:id,name',
                'completedByUser:id,name',
            ])
            ->whereHas('ticket.customer')
            ->latest()
            ->get()
            ->map(fn ($part) => [
                'id'               => $part->id,
                'ticket_id'        => $part->ticket_id,
                'part_name'        => $part->part_name,
                'part_code'        => $part->part_code,
                'status'           => $part->status,
                'created_at'       => $part->created_at->toISOString(),
                'completed_at'     => $part->completed_at?->toISOString(),
                'ticket' => [
                    'id'       => $part->ticket->id,
                    'brand'    => $part->ticket->brand,
                    'model'    => $part->ticket->model,
                    'serial'   => $part->ticket->serial,
                    'address'  => $part->ticket->address,
                    'customer' => ['name' => $part->ticket->customer->name],
                ],
                'user'              => ['name' => $part->user->name],
                'completed_by_user' => $part->completedByUser
                    ? ['name' => $part->completedByUser->name]
                    : null,
            ]);

        $hasOpenPendingParts = PendingPart::query()
            ->where('status', 'pending')
            ->whereHas('ticket.customer')
            ->exists();

        $customers = Customer::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('PendingParts/Index', [
            'pendingParts' => $pendingParts,
            'customers'    => $customers,
            'hasOpenPendingParts' => $hasOpenPendingParts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'part_name' => 'required|string|max:255',
            'part_code' => 'required|string|max:255',
        ]);

        PendingPart::create([
            'ticket_id' => $validated['ticket_id'],
            'user_id' => Auth::id(),
            'part_name' => $validated['part_name'],
            'part_code' => $validated['part_code'],
        ]);

        return redirect()->back()->with('success', 'Repuesto pendiente registrado correctamente');
    }

    public function updateStatus(Request $request, PendingPart $pendingPart)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,completed,cancelled',
        ]);

        $updateData = ['status' => $validated['status']];
        
        // Si se marca como completado, registrar usuario y fecha
        if ($validated['status'] === 'completed') {
            $updateData['completed_by_user_id'] = Auth::id();
            $updateData['completed_at'] = now();
        }
        
        $pendingPart->update($updateData);

        return redirect()->back()->with('success', 'Estado actualizado correctamente');
    }

    public function completeAllByTicket(Request $request, Ticket $ticket)
    {
        $completedAt = now();
        $completedByUserId = Auth::id();

        $updated = PendingPart::query()
            ->where('ticket_id', $ticket->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'completed',
                'completed_by_user_id' => $completedByUserId,
                'completed_at' => $completedAt,
                'updated_at' => $completedAt,
            ]);

        if ($updated === 0) {
            return redirect()->back()->with('info', 'No hay repuestos pendientes para completar');
        }

        return redirect()->back()->with('success', 'Todos los repuestos del ticket fueron completados');
    }

    public function closeAllPending(Request $request)
    {
        $completedAt = now();
        $completedByUserId = Auth::id();

        $updated = PendingPart::query()
            ->where('status', 'pending')
            ->update([
                'status' => 'completed',
                'completed_by_user_id' => $completedByUserId,
                'completed_at' => $completedAt,
                'updated_at' => $completedAt,
            ]);

        if ($updated === 0) {
            return redirect()->back()->with('info', 'No hay repuestos pendientes para completar');
        }

        return redirect()->back()->with('success', 'Todos los repuestos pendientes fueron completados');
    }
}
