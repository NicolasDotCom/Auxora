<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Forzar HTTPS en producción (detrás de Traefik como reverse proxy)
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        date_default_timezone_set(config('app.timezone'));

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

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->email);
        });

        RateLimiter::for('default', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        if (config('app.debug')) {
            DB::listen(function ($query) {
                if ($query->time > 500) {
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