<?php
// Test rapido del horario actualizado
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Helpers\WorkingDaysHelper;
use Carbon\Carbon;

echo "=== Test del NUEVO horario laboral ===\n\n";

// Test 1: Viernes 17:00 -> Sabado 11:00
$start = Carbon::parse('2026-01-09 17:00');
$end   = Carbon::parse('2026-01-10 11:00');
$hours = WorkingDaysHelper::getWorkingHours($start, $end);
echo "Viernes 17:00 -> Sabado 11:00:\n";
echo "  Horas laborables: {$hours}\n";
echo "  Esperado: 1h (vie 17-18) + 2h (sab 08-10) = 3h\n\n";

// Test 2: Sabado 08:00 -> Sabado 12:00
$start = Carbon::parse('2026-01-10 08:00');
$end   = Carbon::parse('2026-01-10 12:00');
$hours = WorkingDaysHelper::getWorkingHours($start, $end);
echo "Sabado 08:00 -> Sabado 12:00:\n";
echo "  Horas laborables: {$hours}\n";
echo "  Esperado: 2h (sabado solo 08:00 - 10:00)\n\n";

// Test 3: Miercoles 10:00 -> Viernes 14:00
$start = Carbon::parse('2026-01-07 10:00');
$end   = Carbon::parse('2026-01-09 14:00');
$hours = WorkingDaysHelper::getWorkingHours($start, $end);
echo "Miercoles 10:00 -> Viernes 14:00:\n";
echo "  Horas laborables: {$hours}\n";
echo "  Esperado: 8h (mie 10-18) + 10h (jue 08-18) + 6h (vie 08-14) = 24h\n\n";

// Test 4: Sabado 06:00 -> Sabado 11:00 (cruza inicio y fin)
$start = Carbon::parse('2026-01-10 06:00');
$end   = Carbon::parse('2026-01-10 11:00');
$hours = WorkingDaysHelper::getWorkingHours($start, $end);
echo "Sabado 06:00 -> Sabado 11:00:\n";
echo "  Horas laborables: {$hours}\n";
echo "  Esperado: 2h (la ventana del sabado es 08-10)\n\n";

// Test 5: Domingo todo el dia
$start = Carbon::parse('2026-01-11 00:00');
$end   = Carbon::parse('2026-01-11 23:59');
$hours = WorkingDaysHelper::getWorkingHours($start, $end);
echo "Domingo todo el dia:\n";
echo "  Horas laborables: {$hours}\n";
echo "  Esperado: 0h (domingo no es laborable)\n\n";

echo "=== Resumen del nuevo horario ===\n";
echo "  Lunes a Viernes: 08:00 - 18:00 (10 horas)\n";
echo "  Sabado: 08:00 - 10:00 (2 horas)\n";
echo "  Domingo: No laborable\n";
echo "  Festivos: No cuentan\n";
