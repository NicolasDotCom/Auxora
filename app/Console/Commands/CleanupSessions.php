<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CleanupSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpiar sesiones expiradas de la base de datos (solo necesario si usas database driver)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (config('session.driver') !== 'database') {
            $this->info('✅ Sessions está usando Redis, no es necesario limpiar');
            return 0;
        }

        $this->info('🧹 Limpiando sesiones expiradas...');
        
        $deleted = DB::table('sessions')
            ->where('last_activity', '<', now()->subHours(2)->timestamp)
            ->delete();

        $this->info("✅ Se eliminaron {$deleted} sesiones expiradas");
        return 0;
    }
}
