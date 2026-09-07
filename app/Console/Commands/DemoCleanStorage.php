<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Vacía las carpetas de adjuntos (ticket-documents y comment-attachments)
 * del disco configurado en FILESYSTEM_DISK. Pensado para correr tras
 * `demo:reset` cuando el disco es S3/MinIO y los archivos persisten
 * aunque la BD se reinicie.
 *
 *     php artisan demo:clean-storage
 *     php artisan demo:clean-storage --disk=s3
 */
class DemoCleanStorage extends Command
{
    protected $signature = 'demo:clean-storage
        {--disk= : Disco a limpiar (por defecto config("filesystems.default"))}';

    protected $description = 'Elimina todos los adjuntos subidos al storage (uso demo).';

    public function handle(): int
    {
        if (! config('app.demo.enabled')) {
            $this->error('❌ El modo demo está desactivado. Abortando.');
            return self::FAILURE;
        }

        $disk = $this->option('disk') ?: config('filesystems.default');
        $folders = ['ticket-documents', 'comment-attachments'];
        $totalDeleted = 0;

        foreach ($folders as $folder) {
            if (! Storage::disk($disk)->exists($folder)) {
                $this->line("· {$folder}/ no existe en disco '{$disk}', saltando.");
                continue;
            }

            $files = Storage::disk($disk)->allFiles($folder);
            $count = count($files);

            if ($count === 0) {
                $this->line("· {$folder}/ está vacío.");
                continue;
            }

            if (! $this->confirm("Borrar {$count} archivos en {$folder}/ (disco: {$disk})?", true)) {
                continue;
            }

            Storage::disk($disk)->delete($files);
            $totalDeleted += $count;
            $this->info("✓ {$folder}/: {$count} archivos eliminados.");
        }

        $this->newLine();
        $this->info("✅ Limpieza completada. Total archivos borrados: {$totalDeleted}");

        return self::SUCCESS;
    }
}