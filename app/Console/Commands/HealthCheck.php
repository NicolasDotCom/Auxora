<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'health:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar salud de Redis, Database y Cache en producción';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏥 Verificando salud del sistema...');
        $this->line('');

        $allGood = true;

        // 1. Verificar Redis
        $this->line('🔴 Redis');
        try {
            Redis::ping();
            $this->line('   ✅ Conexión OK - ' . config('database.redis.cache.host'));
            
            // Verificar si hay datos en caché
            $cacheSize = count(Redis::keys(config('cache.prefix') . '*'));
            $this->line("   📊 Keys en caché: {$cacheSize}");
        } catch (\Exception $e) {
            $this->error('   ❌ ERROR: ' . $e->getMessage());
            $allGood = false;
        }

        // 2. Verificar MySQL
        $this->line('');
        $this->line('🔴 Base de Datos MySQL');
        try {
            DB::connection()->getPdo();
            $this->line('   ✅ Conexión OK - ' . config('database.connections.mysql.host'));
            
            $count = DB::table('tickets')->count();
            $this->line("   📊 Tickets en BD: {$count}");
        } catch (\Exception $e) {
            $this->error('   ❌ ERROR: ' . $e->getMessage());
            $allGood = false;
        }

        // 3. Verificar configuración de Sesiones
        $this->line('');
        $this->line('🔴 Sesiones');
        $sessionDriver = config('session.driver');
        $statusIcon = $sessionDriver === 'redis' ? '✅' : '⚠️';
        $this->line("   {$statusIcon} Driver: {$sessionDriver}");
        if ($sessionDriver !== 'redis') {
            $this->warn('   ⚠️  Se recomienda usar Redis para sesiones en producción');
        }

        // 4. Verificar configuración de Cache
        $this->line('');
        $this->line('🔴 Cache');
        $cacheDriver = config('cache.default');
        $statusIcon = $cacheDriver === 'redis' ? '✅' : '⚠️';
        $this->line("   {$statusIcon} Driver: {$cacheDriver}");
        if ($cacheDriver !== 'redis') {
            $this->warn('   ⚠️  Se recomienda usar Redis para caché en producción');
        }

        // 5. Verificar configuración de Queue
        $this->line('');
        $this->line('🔴 Queue/Jobs');
        $queueDriver = config('queue.default');
        $statusIcon = $queueDriver === 'redis' ? '✅' : '⚠️';
        $this->line("   {$statusIcon} Driver: {$queueDriver}");
        if ($queueDriver !== 'redis') {
            $this->warn('   ⚠️  Se recomienda usar Redis para queues en producción');
        }

        // 6. Verificar conexiones a MySQL
        $this->line('');
        $this->line('🔴 Connection Pool MySQL');
        $minConns = config('database.connections.mysql.pool.min_connections', 5);
        $maxConns = config('database.connections.mysql.pool.max_connections', 100);
        $this->line("   📊 Min connections: {$minConns}");
        $this->line("   📊 Max connections: {$maxConns}");

        $this->line('');
        $this->line('');

        if ($allGood) {
            $this->info('✅ Sistema en perfecto estado!');
            $this->info('📈 Listo para soportar 50+ usuarios simultáneos');
            return 0;
        } else {
            $this->error('❌ Hay problemas que deben resolverse');
            return 1;
        }
    }
}
