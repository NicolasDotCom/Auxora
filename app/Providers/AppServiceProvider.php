<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set PHP timezone
        date_default_timezone_set(config('app.timezone'));

        // Configurar rate limiting más agresivo para API
        RateLimiter::for('api-tickets', function (Request $request) {
            $tokenId = $request->user()?->currentAccessToken()?->id;
            $identifier = $tokenId
                ? 'token:'.$tokenId
                : ($request->user()?->id ? 'user:'.$request->user()->id : 'ip:'.$request->ip());

            return Limit::perMinute(90)
                ->by($identifier)
                ->response(function () {
                    return response()->json([
                        'message' => 'Demasiadas solicitudes. Intenta nuevamente en unos segundos.',
                    ], 429);
                });
        });

        // Rate limiting para login (más restrictivo para seguridad)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->email);
        });

        // Rate limiting general para todas las rutas web
        RateLimiter::for('default', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Monitorear queries lentas en desarrollo
        if (config('app.debug')) {
            DB::listen(function ($query) {
                if ($query->time > 500) { // Query > 500ms
                    Log::warning('Slow query detected', [
                        'query' => $query->sql,
                        'time' => $query->time . 'ms',
                        'bindings' => $query->bindings,
                    ]);
                }
            });
        }

    }
}
