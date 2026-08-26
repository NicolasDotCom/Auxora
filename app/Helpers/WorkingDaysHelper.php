<?php

namespace App\Helpers;

use Carbon\Carbon;

class WorkingDaysHelper
{
    /**
     * Calcular días laborables entre dos fechas (excluyendo domingos y festivos)
     * 
     * @param Carbon $startDate Fecha de inicio
     * @param Carbon $endDate Fecha de fin
     * @return int Número de días laborables
     */
    public static function getWorkingDays(Carbon $startDate, Carbon $endDate, array $preloadedHolidays = []): int
    {
        if ($startDate->greaterThan($endDate)) {
            return 0;
        }

        $workingDays = 0;
        $holidays = !empty($preloadedHolidays)
            ? $preloadedHolidays
            : self::getHolidays($startDate, $endDate);
        
        $current = $startDate->copy();
        
        while ($current->lessThanOrEqualTo($endDate)) {
            // No contar domingos (0 = domingo en Carbon)
            if ($current->dayOfWeek !== 0) {
                // No contar si es un día festivo
                if (!in_array($current->format('Y-m-d'), $holidays)) {
                    $workingDays++;
                }
            }
            $current->addDay();
        }
        
        return $workingDays;
    }

    /**
     * Calcular horas laborables entre dos fechas según jornada:
     * - Lunes a viernes: 08:00 - 18:00
     * - Sábado: 08:00 - 10:00
     * - Domingo y festivos: no cuentan
     *
     * @param Carbon $startDate Fecha de inicio
     * @param Carbon $endDate Fecha de fin
     * @return float Número de horas laborables
     */
    public static function getWorkingHours(Carbon $startDate, Carbon $endDate, array $preloadedHolidays = []): float
    {
        if ($startDate->greaterThan($endDate)) {
            return 0;
        }

        $holidays = !empty($preloadedHolidays)
            ? $preloadedHolidays
            : self::getHolidays($startDate, $endDate);

        $totalHours = 0.0;
        $currentDay = $startDate->copy()->startOfDay();
        $lastDay = $endDate->copy()->startOfDay();

        while ($currentDay->lessThanOrEqualTo($lastDay)) {
            $dayStr = $currentDay->format('Y-m-d');

            if (!in_array($dayStr, $holidays, true)) {
                $window = self::getWorkWindowForDay($currentDay);

                if ($window !== null) {
                    [$workStartHour, $workStartMinute, $workEndHour, $workEndMinute] = $window;

                    $windowStart = $currentDay->copy()->setTime($workStartHour, $workStartMinute, 0);
                    $windowEnd = $currentDay->copy()->setTime($workEndHour, $workEndMinute, 0);

                    $effectiveStart = $startDate->greaterThan($windowStart) ? $startDate->copy() : $windowStart;
                    $effectiveEnd = $endDate->lessThan($windowEnd) ? $endDate->copy() : $windowEnd;

                    if ($effectiveEnd->greaterThan($effectiveStart)) {
                        $totalHours += $effectiveStart->floatDiffInHours($effectiveEnd);
                    }
                }
            }

            $currentDay->addDay();
        }

        return round($totalHours, 2);
    }

    /**
     * Retorna la ventana horaria laboral de un día.
     * [hora_inicio, minuto_inicio, hora_fin, minuto_fin]
     */
    private static function getWorkWindowForDay(Carbon $date): ?array
    {
        // 0 = domingo, 6 = sábado
        if ($date->dayOfWeek === 0) {
            return null;
        }

        if ($date->dayOfWeek === 6) {
            // Sábado: 08:00 a 10:00
            return [8, 0, 10, 0];
        }

        // Lunes a viernes: 08:00 a 18:00
        return [8, 0, 18, 0];
    }

    /**
     * Obtener array de días festivos en el rango de fechas
     * Optimización: Usar caché para días festivos
     * 
     * @param Carbon $startDate Fecha de inicio
     * @param Carbon $endDate Fecha de fin
     * @return array Array de fechas festivas en formato 'Y-m-d'
     */
    private static function getHolidays(Carbon $startDate, Carbon $endDate): array
    {
        // Optimización: Usar caché para obtener festivos
        $years = range($startDate->year, $endDate->year);
        $holidays = [];
        
        foreach ($years as $year) {
            $yearHolidays = \App\Services\CacheService::getHolidays($year);
            
            // Convertir Collection de Holiday a array de fechas string
            $yearHolidayDates = $yearHolidays->map(function($holiday) {
                return $holiday->date instanceof Carbon 
                    ? $holiday->date->format('Y-m-d')
                    : Carbon::parse($holiday->date)->format('Y-m-d');
            })->toArray();
            
            $holidays = array_merge($holidays, $yearHolidayDates);
        }
        
        // Filtrar solo los festivos en el rango de fechas
        return array_filter($holidays, function($holiday) use ($startDate, $endDate) {
            $date = Carbon::parse($holiday);
            return $date->between($startDate, $endDate);
        });
    }

    /**
     * Verificar si una fecha es día laborable
     * 
     * @param Carbon $date Fecha a verificar
     * @return bool True si es día laborable
     */
    public static function isWorkingDay(Carbon $date): bool
    {
        // No es domingo
        if ($date->dayOfWeek === 0) {
            return false;
        }

        // No es festivo - Optimización: usar caché
        $holidays = \App\Services\CacheService::getHolidays($date->year);
        $dateStr = $date->format('Y-m-d');
        
        $isHoliday = $holidays->contains(function($holiday) use ($dateStr) {
            // $holiday es un objeto Holiday con atributo date
            $holidayDate = $holiday->date instanceof Carbon 
                ? $holiday->date->format('Y-m-d')
                : Carbon::parse($holiday->date)->format('Y-m-d');
            return $holidayDate === $dateStr;
        });

        return !$isHoliday;
    }
}
