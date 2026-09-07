<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class ApiTokenManagerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user?->hasRole('admin') ?? false;

        $tokensQuery = PersonalAccessToken::query()->with('tokenable:id,name,email')->latest();

        if (!$isAdmin) {
            $tokensQuery->where('tokenable_type', User::class)
                ->where('tokenable_id', $user->id);
        }

        return Inertia::render('Tokens/Index', [
            'tokens' => $tokensQuery->get()->map(function (PersonalAccessToken $token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'abilities' => $token->abilities,
                    'last_used_at' => $token->last_used_at,
                    'expires_at' => $token->expires_at,
                    'created_at' => $token->created_at,
                    'owner' => [
                        'id' => $token->tokenable?->id,
                        'name' => $token->tokenable?->name,
                        'email' => $token->tokenable?->email,
                    ],
                ];
            }),
            'users' => $isAdmin
                ? User::query()->select('id', 'name', 'email')->orderBy('name')->get()
                : [],
            'isAdmin' => $isAdmin,
            'newToken' => session('new_api_token'),
            'abilitiesCatalog' => [
                'tickets:read',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Bloqueo de demo: no permitir crear tokens API en el demo público.
        // Evita que un visitante abuse del rate-limit Sanctum (90 req/min por token).
        if (\App\Helpers\DemoHelper::isEnabled()) {
            abort(403, 'La creación de tokens API está deshabilitada en el modo demo.');
        }

        $isAdmin = $request->user()?->hasRole('admin') ?? false;

        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'abilities' => 'required|array|min:1',
            'abilities.*' => 'in:tickets:read',
            'expires_at' => 'nullable|date|after:now',
            'user_id' => $isAdmin ? 'nullable|exists:users,id' : 'nullable',
        ]);

        $tokenOwner = $request->user();
        if ($isAdmin && !empty($validated['user_id'])) {
            $tokenOwner = User::findOrFail($validated['user_id']);
        }

        $expiresAt = !empty($validated['expires_at']) ? Carbon::parse($validated['expires_at']) : null;

        $newToken = $tokenOwner->createToken(
            $validated['name'],
            $validated['abilities'],
            $expiresAt
        );

        return redirect()
            ->route('api-tokens.index')
            ->with('success', 'Token creado correctamente.')
            ->with('new_api_token', $newToken->plainTextToken);
    }

    public function destroy(Request $request, PersonalAccessToken $token): RedirectResponse
    {
        $isAdmin = $request->user()?->hasRole('admin') ?? false;
        $isOwner = $token->tokenable_type === User::class && $token->tokenable_id === $request->user()->id;

        if (!$isAdmin && !$isOwner) {
            abort(403, 'No tienes autorización para revocar este token.');
        }

        $token->delete();

        return redirect()->route('api-tokens.index')->with('success', 'Token revocado correctamente.');
    }
}
