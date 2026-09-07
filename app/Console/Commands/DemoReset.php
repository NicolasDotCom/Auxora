<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Resetea la base de datos del demo y la vuelve a sembrar con datos limpios.
 * Pensado para correr como cron diario en VPS con Coolify:
 *
 *     0 3 * * * cd /app && php artisan demo:reset --force --no-interaction
 *
 * NO usar en producción real: borra TODOS los tickets, comentarios,
 * adjuntos y catálogos (clientes, técnicos) dejando solo los 4 usuarios
 * demo sembrados.
 */
class DemoReset extends Command
{
    protected $signature = 'demo:reset
        {--force : Forzar la ejecución sin confirmación (uso en cron)}
        {--keep-users : No borrar los usuarios del sistema}';

    protected $description = 'Reset completo de la base demo: migrate:fresh + DemoDataSeeder';

    public function handle(): int
    {
        if (! config('app.demo.enabled')) {
            $this->error('❌ El modo demo está desactivado (APP_DEMO=false). Abortando.');
            return self::FAILURE;
        }

        if (! $this->option('force')) {
            $this->warn('⚠️  Esto BORRARÁ todos los tickets, comentarios, adjuntos, clientes y técnicos.');
            $this->warn('   Solo se conservarán los usuarios del sistema (si usas --keep-users).');
            if (! $this->confirm('¿Continuar?', false)) {
                $this->info('Cancelado.');
                return self::SUCCESS;
            }
        }

        $start = now();

        $this->info('🔄 Ejecutando migrate:fresh --seed...');
        $this->newLine();

        $exitCode = $this->call('migrate:fresh', [
            '--seed'    => true,
            '--force'   => true,
        ]);

        if ($exitCode !== self::SUCCESS) {
            $this->error('❌ migrate:fresh falló.');
            return $exitCode;
        }

        // Limpieza post-seed: purgar caché
        $this->call('cache:clear');
        $this->call('optimize:clear');

        $elapsed = (int) $start->diffInSeconds(now());
        $this->newLine();
        $this->info("✅ Demo reseteado en {$elapsed}s.");

        return self::SUCCESS;
    }
}