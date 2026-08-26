<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BackupDocuments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:documents {--download : Descargar backup localmente}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear backup de todos los documentos de tickets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Iniciando backup de documentos...');
        
        // Crear carpeta de backups si no existe
        $backupDir = storage_path('app/backups');
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        // Nombre del archivo backup con fecha
        $timestamp = date('Y-m-d_His');
        $backupFileName = "documents_backup_{$timestamp}.zip";
        $backupPath = $backupDir . '/' . $backupFileName;
        
        // Crear archivo ZIP
        $zip = new ZipArchive();
        if ($zip->open($backupPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $this->error('❌ Error al crear archivo ZIP');
            return 1;
        }
        
        // Ruta de documentos
        $documentsPath = storage_path('app/public/ticket-documents');
        
        if (!is_dir($documentsPath)) {
            $this->warn('⚠️  Carpeta de documentos no existe');
            return 1;
        }
        
        // Agregar archivos al ZIP
        $files = glob($documentsPath . '/*');
        $fileCount = 0;
        
        foreach ($files as $file) {
            if (is_file($file)) {
                $relativePath = basename($file);
                $zip->addFile($file, 'ticket-documents/' . $relativePath);
                $fileCount++;
            }
        }
        
        $zip->close();
        
        // Obtener tamaño del backup
        $backupSize = filesize($backupPath);
        $backupSizeMB = round($backupSize / 1048576, 2);
        
        $this->newLine();
        $this->info("✅ Backup completado exitosamente!");
        $this->line("📁 Archivos respaldados: {$fileCount}");
        $this->line("💾 Tamaño del backup: {$backupSizeMB} MB");
        $this->line("📍 Ubicación: {$backupPath}");
        $this->newLine();
        
        // Mostrar instrucciones para descargar
        $this->line("📥 Para descargar el backup:");
        $this->line("   Accede a: " . config('app.url') . "/backup/download/{$backupFileName}");
        $this->newLine();
        
        // Listar backups anteriores
        $this->info("📦 Backups disponibles:");
        $backups = glob($backupDir . '/documents_backup_*.zip');
        
        foreach ($backups as $backup) {
            $name = basename($backup);
            $size = round(filesize($backup) / 1048576, 2);
            $date = date('d/m/Y H:i', filemtime($backup));
            $this->line("   • {$name} ({$size} MB) - {$date}");
        }
        
        return 0;
    }
}
