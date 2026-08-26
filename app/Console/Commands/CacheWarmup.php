<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Services\CacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CacheWarmup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warmup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Precachear datos críticos para mejor performance en producción';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔥 Iniciando precaché de datos críticos...');

        try {
            // Cachear listados
            $this->line('  ⏳ Cacheando clientes...');
            Cache::remember('stats:total_customers', 3600, fn() => Customer::count());
            CacheService::getCompanyNames();

            $this->line('  ⏳ Cacheando técnicos de soporte...');
            Cache::remember('stats:total_supports', 3600, fn() => Support::count());
            CacheService::getSupportsList();
            Cache::remember('stats:support_speciality', 3600, function() {
                return Support::query()
                    ->select('speciality', DB::raw('count(*) as count'))
                    ->groupBy('speciality')
                    ->get()
                    ->mapWithKeys(fn($item) => [$item->speciality => $item->count])
                    ->all();
            });

            $this->line('  ⏳ Cacheando estadísticas de tickets...');
            Cache::remember('stats:total_tickets', 3600, fn() => Ticket::count());
            Cache::remember('stats:ticket_by_status', 300, function() {
                return Ticket::query()
                    ->select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get()
                    ->mapWithKeys(fn($item) => [$item->status => $item->count])
                    ->all();
            });

            $this->line('  ⏳ Cacheando días festivos...');
            CacheService::getHolidays(date('Y'));

            $this->info('✅ Precaché completado exitosamente!');
            $this->info('📊 Los datos críticos ya están en Redis para acceso rápido');

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Error al precachear: ' . $e->getMessage());
            return 1;
        }
    }
}
