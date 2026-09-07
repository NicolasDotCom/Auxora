<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloquea el acceso si el modo demo está desactivado.
 * Evita exponer accidentalmente las rutas /welcome y /demo/* en producción real.
 */
class EnsureDemoModeEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('app.demo.enabled')) {
            abort(404);
        }

        return $next($request);
    }
}