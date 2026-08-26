<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketApiController extends Controller
{
    private function ensureAbility(Request $request, string $ability): ?JsonResponse
    {
        $token = $request->user()?->currentAccessToken();

        if ($token && !$request->user()->tokenCan($ability)) {
            return response()->json([
                'message' => 'El token no tiene permisos para esta accion.',
                'required_ability' => $ability,
            ], 403);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($response = $this->ensureAbility($request, 'tickets:read')) {
            return $response;
        }

        $request->validate([
            'ticket_id' => 'nullable|integer|min:1',
            'company_name' => 'nullable|string|min:2|max:100',
            'support_id' => 'nullable|integer|exists:supports,id',
            'status' => 'nullable|in:Open,In Progress,Closed',
            'search' => 'nullable|string|min:2|max:80',
            'page' => 'nullable|integer|min:1|max:1000',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Ticket::query()
            ->with(['customer:id,name,email', 'support:id,name,email', 'user:id,name'])
            ->withCount(['documents', 'comments'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('ticket_id')) {
            $query->where('id', (int) $request->integer('ticket_id'));
        }

        if ($request->filled('company_name')) {
            $companyName = (string) $request->string('company_name');
            $query->where(function ($q) use ($companyName) {
                $q->whereHas('customer', function ($customerQuery) use ($companyName) {
                    $customerQuery->where('name', 'like', "%{$companyName}%");
                })->orWhere('cliente_externo', 'like', "%{$companyName}%");
            });
        }

        if ($request->filled('support_id')) {
            $query->where('support_id', (int) $request->integer('support_id'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('serial', 'like', "%{$search}%")
                    ->orWhere('cliente_externo', 'like', "%{$search}%");
            });
        }

        $tickets = $query->paginate((int) ($request->integer('per_page') ?: 15));

        return response()->json($tickets);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        if ($response = $this->ensureAbility($request, 'tickets:read')) {
            return $response;
        }

        $ticket->load([
            'customer:id,name,email,phone,name_user',
            'support:id,name,email,phone',
            'user:id,name,email',
            'documents:id,ticket_id,original_name,mime_type,file_size,created_at',
            'pendingParts:id,ticket_id,part_name,part_code,status,created_at',
        ])->loadCount(['comments']);

        return response()->json([
            'data' => $ticket,
        ]);
    }
}
