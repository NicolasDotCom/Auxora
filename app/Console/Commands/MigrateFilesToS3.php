<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\TicketDocument;
use App\Models\TicketCommentAttachment;

class MigrateFilesToS3 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'files:migrate-to-s3 
                            {--dry-run : Simular sin migrar archivos}
                            {--type=all : Tipo de archivos (documents, attachments, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrar archivos locales a S3';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $type = $this->option('type');
        
        $this->info('🚀 Iniciando migración de archivos a S3...');
        $this->info('Modo: ' . ($dryRun ? 'DRY RUN (simulación)' : 'PRODUCCIÓN'));
        $this->newLine();

        // Verificar que S3 esté configurado
        if (config('filesystems.default') !== 's3' && !$dryRun) {
            $this->warn('⚠️  Advertencia: FILESYSTEM_DISK no está configurado como "s3"');
            $this->warn('Considera cambiar FILESYSTEM_DISK=s3 en tu .env de producción');
            $this->newLine();
        }

        $totalMigrated = 0;
        $totalErrors = 0;
        $totalSize = 0;

        // Migrar documentos de tickets
        if (in_array($type, ['all', 'documents'])) {
            $this->info('📄 Migrando documentos de tickets...');
            $result = $this->migrateTicketDocuments($dryRun);
            $totalMigrated += $result['migrated'];
            $totalErrors += $result['errors'];
            $totalSize += $result['size'];
        }

        // Migrar adjuntos de comentarios
        if (in_array($type, ['all', 'attachments'])) {
            $this->info('📎 Migrando adjuntos de comentarios...');
            $result = $this->migrateCommentAttachments($dryRun);
            $totalMigrated += $result['migrated'];
            $totalErrors += $result['errors'];
            $totalSize += $result['size'];
        }

        $this->newLine();
        $this->info('✅ Migración completada!');
        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Archivos migrados', $totalMigrated],
                ['Errores', $totalErrors],
                ['Tamaño total', $this->formatBytes($totalSize)],
                ['Modo', $dryRun ? 'DRY RUN' : 'PRODUCCIÓN']
            ]
        );

        return Command::SUCCESS;
    }

    private function migrateTicketDocuments($dryRun)
    {
        $documents = TicketDocument::all();
        $migrated = 0;
        $errors = 0;
        $totalSize = 0;

        $bar = $this->output->createProgressBar($documents->count());
        $bar->start();

        foreach ($documents as $document) {
            try {
                // Intentar desde storage/app/public (nuevo)
                $localPath = storage_path('app/public/' . $document->file_path);
                
                // Si no existe, intentar desde public/storage (symlink antiguo)
                if (!file_exists($localPath)) {
                    $localPath = public_path('storage/' . $document->file_path);
                }
                
                // Si aún no existe, intentar con el file_name
                if (!file_exists($localPath) && $document->file_name) {
                    $localPath = storage_path('app/public/ticket-documents/' . $document->file_name);
                }

                if (file_exists($localPath)) {
                    $fileSize = filesize($localPath);
                    $totalSize += $fileSize;

                    if (!$dryRun) {
                        // Leer el contenido del archivo
                        $contents = file_get_contents($localPath);
                        
                        // Subir a S3 usando el disco público
                        Storage::disk('s3')->put($document->file_path, $contents, 'public');
                        
                        // Verificar que se subió correctamente
                        if (!Storage::disk('s3')->exists($document->file_path)) {
                            throw new \Exception('El archivo no se subió correctamente a S3');
                        }
                    }
                    
                    $migrated++;
                } else {
                    $this->newLine();
                    $this->warn("⚠️  Archivo no encontrado: {$document->original_name} (ID: {$document->id})");
                    $errors++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Error al migrar {$document->original_name}: " . $e->getMessage());
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->newLine();

        return [
            'migrated' => $migrated,
            'errors' => $errors,
            'size' => $totalSize
        ];
    }

    private function migrateCommentAttachments($dryRun)
    {
        $attachments = TicketCommentAttachment::all();
        $migrated = 0;
        $errors = 0;
        $totalSize = 0;

        $bar = $this->output->createProgressBar($attachments->count());
        $bar->start();

        foreach ($attachments as $attachment) {
            try {
                $localPath = storage_path('app/public/' . $attachment->file_path);
                
                if (!file_exists($localPath)) {
                    $localPath = public_path('storage/' . $attachment->file_path);
                }

                if (file_exists($localPath)) {
                    $fileSize = filesize($localPath);
                    $totalSize += $fileSize;

                    if (!$dryRun) {
                        $contents = file_get_contents($localPath);
                        Storage::disk('s3')->put($attachment->file_path, $contents, 'public');
                        
                        if (!Storage::disk('s3')->exists($attachment->file_path)) {
                            throw new \Exception('El archivo no se subió correctamente a S3');
                        }
                    }
                    
                    $migrated++;
                } else {
                    $this->newLine();
                    $this->warn("⚠️  Adjunto no encontrado: {$attachment->file_name} (ID: {$attachment->id})");
                    $errors++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Error al migrar adjunto: " . $e->getMessage());
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->newLine();

        return [
            'migrated' => $migrated,
            'errors' => $errors,
            'size' => $totalSize
        ];
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
