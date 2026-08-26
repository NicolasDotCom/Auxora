<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiPerformanceMonitor
{
    public function handle(Request $request, Closure $next): Response
    {
        $queryCount = 0;
        $queryTimeMs = 0.0;

        DB::listen(function (QueryExecuted $query) use (&$queryCount, &$queryTimeMs): void {
            $queryCount++;
            $queryTimeMs += (float) $query->time;
        });

        $start = hrtime(true);
        $response = $next($request);
        $durationMs = (hrtime(true) - $start) / 1_000_000;

        $response->headers->set('X-Response-Time-Ms', number_format($durationMs, 2, '.', ''));
        $response->headers->set('X-DB-Time-Ms', number_format($queryTimeMs, 2, '.', ''));
        $response->headers->set('X-DB-Queries', (string) $queryCount);

        $slowRequestThresholdMs = (float) env('API_SLOW_REQUEST_MS', 800);
        $slowDbThresholdMs = (float) env('API_SLOW_DB_MS', 400);

        if ($durationMs >= $slowRequestThresholdMs || $queryTimeMs >= $slowDbThresholdMs) {
            Log::warning('api.performance.slow', [
                'method' => $request->method(),
                'path' => $request->path(),
                'route' => $request->route()?->getName(),
                'status' => $response->getStatusCode(),
                'duration_ms' => round($durationMs, 2),
                'db_time_ms' => round($queryTimeMs, 2),
                'db_queries' => $queryCount,
                'user_id' => $request->user()?->id,
                'token_id' => $request->user()?->currentAccessToken()?->id,
                'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            ]);
        }

        return $response;
    }
}
