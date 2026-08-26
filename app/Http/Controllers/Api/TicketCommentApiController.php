<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketCommentApiController extends Controller
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

    public function index(Request $request, Ticket $ticket): JsonResponse
    {
        if ($response = $this->ensureAbility($request, 'tickets:read')) {
            return $response;
        }

        $request->validate([
            'page' => 'nullable|integer|min:1|max:1000',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $comments = $ticket->comments()
            ->with(['user:id,name,email', 'attachments:id,ticket_comment_id,file_name,mime_type,file_size'])
            ->latest()
            ->paginate((int) ($request->integer('per_page') ?: 20));

        return response()->json($comments);
    }
}
