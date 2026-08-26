<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Support;
use App\Models\Holiday;
use Illuminate\Support\Facades\Cache;

/**
 * Servicio centralizado de caché para datos que cambian poco
 * y se consultan frecuentemente.
 * 
 * Implementa estrategia de cache-aside pattern:
 * 1. Verificar caché
 * 2. Si no existe, consultar BD
 * 3. Guardar en caché
 * 4. Retornar dato
 */
class CacheService
{
    /**
     * TTL por defecto de catalogos: 15 minutos
     * Mantiene baja latencia con datos suficientemente frescos.
     */
    const DEFAULT_TTL = 900;

    /**
     * TTL para datos que raramente cambian: 24 horas
     */
    const LONG_TTL = 86400;

    /**
     * TTL para estadísticas: 5 minutos
     */
    const STATS_TTL = 300;

    /**
     * Obtener lista de clientes (para dropdowns y selects)
     * Cache por 1 hora
     * 
     * @return \Illuminate\Support\Collection
     */
    public static function getCustomersList()
    {
        return Cache::remember('customers_list', self::DEFAULT_TTL, function () {
            return Customer::select('id', 'name', 'name_user', 'email')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Obtener lista de técnicos de soporte
     * Cache por 1 hora
     * 
     * @return \Illuminate\Support\Collection
     */
    public static function getSupportsList()
    {
        return Cache::remember('supports_list', self::DEFAULT_TTL, function () {
            return Support::select('id', 'name', 'email', 'speciality')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Obtener nombres únicos de empresas
     * Cache por 1 hora
     * 
     * @return \Illuminate\Support\Collection
     */
    public static function getCompanyNames()
    {
        return Cache::remember('company_names', self::DEFAULT_TTL, function () {
            return Customer::select('name')
                ->distinct()
                ->orderBy('name')
                ->pluck('name');
        });
    }

    /**
     * Obtener días festivos del año actual
     * Cache por 24 horas
     * 
     * @param int|null $year Año a consultar (default: año actual)
     * @return \Illuminate\Support\Collection Colección de objetos Holiday con fecha y nombre
     */
    public static function getHolidays($year = null)
    {
        $year = $year ?? now()->year;
        
        return Cache::remember("holidays_{$year}", self::LONG_TTL, function () use ($year) {
            return Holiday::whereYear('date', $year)
                ->orderBy('date')
                ->get();
        });
    }

    /**
     * Limpiar caché de clientes
     * Llamar cuando se crea/actualiza/elimina un cliente
     */
    public static function clearCustomersCache()
    {
        Cache::forget('customers_list');
        Cache::forget('company_names');
    }

    /**
     * Limpiar caché de técnicos
     * Llamar cuando se crea/actualiza/elimina un técnico
     */
    public static function clearSupportsCache()
    {
        Cache::forget('supports_list');
    }

    /**
     * Limpiar caché de días festivos
     * Llamar cuando se crea/actualiza/elimina un festivo
     */
    public static function clearHolidaysCache()
    {
        // Limpiar festivos de años recientes (año pasado, actual, siguiente)
        for ($year = now()->year - 1; $year <= now()->year + 1; $year++) {
            Cache::forget("holidays_{$year}");
        }
    }

    /**
     * Obtener estadísticas del dashboard con caché
     * Cache por 5 minutos
     * 
     * @param int $userId ID del usuario
     * @param \Closure $callback Función que retorna las estadísticas
     * @return mixed
     */
    public static function getDashboardStats($userId, $callback)
    {
        return Cache::remember("dashboard_stats_{$userId}", self::STATS_TTL, $callback);
    }

    /**
     * Obtener estadísticas del ranking de técnicos con caché.
     *
     * @param string $cacheKey Clave única del ranking (incluye filtros)
     * @param \Closure $callback Función que retorna los datos del ranking
     * @return mixed
     */
    public static function getTechnicianRankingStats($cacheKey, $callback)
    {
        return Cache::remember($cacheKey, self::STATS_TTL, $callback);
    }

    /**
     * Limpiar todas las cachés del sistema
     * Útil después de seeders o cambios masivos
     */
    public static function clearAll()
    {
        Cache::forget('customers_list');
        Cache::forget('supports_list');
        Cache::forget('company_names');
        
        // Limpiar festivos de años recientes
        for ($year = now()->year - 1; $year <= now()->year + 1; $year++) {
            Cache::forget("holidays_{$year}");
        }
    }
}
