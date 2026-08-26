<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\TicketDocument;

class DiagnoseDocuments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'diagnose:documents {--document-id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Diagnosticar ubicación y estado de documentos de tickets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== DIAGNÓSTICO DE DOCUMENTOS ===');
        $this->newLine();

        // Información del sistema de archivos
        $this->info('📁 CONFIGURACIÓN DE ALMACENAMIENTO:');
        $this->line('Storage público root: ' . Storage::disk('public')->path(''));
        $this->line('Storage público URL: ' . config('filesystems.disks.public.url'));
        $this->line('APP_URL: ' . config('app.url'));
        $this->newLine();

        // Verificar enlace simbólico
        $publicPath = public_path('storage');
        $storagePath = storage_path('app/public');
        
        $this->info('🔗 ENLACE SIMBÓLICO:');
        $this->line('Ruta pública: ' . $publicPath);
        $this->line('Apunta a: ' . $storagePath);
        
        if (is_link($publicPath)) {
            $this->line('✅ Enlace simbólico existe');
            $this->line('   Destino real: ' . readlink($publicPath));
        } else {
            $this->error('❌ Enlace simbólico NO existe');
            $this->warn('   Ejecuta: php artisan storage:link');
        }
        $this->newLine();

        // Verificar carpeta de documentos
        $this->info('📂 CARPETA DE DOCUMENTOS:');
        $documentsPath = 'ticket-documents';
        $fullPath = Storage::disk('public')->path($documentsPath);
        $this->line('Ruta relativa: ' . $documentsPath);
        $this->line('Ruta absoluta: ' . $fullPath);
        
        if (Storage::disk('public')->exists($documentsPath)) {
            $this->line('✅ Carpeta existe');
            
            // Listar archivos
            $files = Storage::disk('public')->files($documentsPath);
            $this->line('   Archivos encontrados: ' . count($files));
        } else {
            $this->error('❌ Carpeta NO existe');
        }
        $this->newLine();

        // Verificar documentos en BD
        $this->info('💾 DOCUMENTOS EN BASE DE DATOS:');
        $totalDocs = TicketDocument::count();
        $this->line('Total de documentos registrados: ' . $totalDocs);
        
        if ($this->option('document-id')) {
            // Diagnóstico de un documento específico
            $docId = $this->option('document-id');
            $doc = TicketDocument::find($docId);
            
            if ($doc) {
                $this->newLine();
                $this->info("📄 DOCUMENTO #$docId:");
                $this->line('Nombre original: ' . $doc->original_name);
                $this->line('Nombre archivo: ' . $doc->file_name);
                $this->line('Ruta en BD: ' . $doc->file_path);
                $this->line('Ruta absoluta: ' . Storage::disk('public')->path($doc->file_path));
                $this->line('Tamaño: ' . $doc->formatted_size);
                $this->line('Tipo MIME: ' . $doc->mime_type);
                
                if (Storage::disk('public')->exists($doc->file_path)) {
                    $this->line('✅ Archivo existe físicamente');
                    $realSize = Storage::disk('public')->size($doc->file_path);
                    $this->line('   Tamaño real: ' . number_format($realSize / 1024, 2) . ' KB');
                } else {
                    $this->error('❌ Archivo NO existe físicamente');
                }
            } else {
                $this->error("Documento #$docId no encontrado en BD");
            }
        } else {
            // Verificar todos los documentos
            $this->newLine();
            $this->info('🔍 VERIFICANDO TODOS LOS DOCUMENTOS:');
            
            $documents = TicketDocument::all();
            $missing = 0;
            $found = 0;
            
            foreach ($documents as $doc) {
                if (Storage::disk('public')->exists($doc->file_path)) {
                    $found++;
                } else {
                    $missing++;
                    if ($missing <= 10) { // Mostrar solo los primeros 10
                        $this->warn("  ❌ Falta: {$doc->original_name} (ID: {$doc->id})");
                        $this->line("     Ruta: {$doc->file_path}");
                    }
                }
            }
            
            $this->newLine();
            $this->line("✅ Archivos encontrados: $found");
            $this->line("❌ Archivos faltantes: $missing");
            
            if ($missing > 10) {
                $this->warn("   (Mostrando solo los primeros 10 de $missing faltantes)");
            }
        }
        
        $this->newLine();
        $this->info('=== FIN DEL DIAGNÓSTICO ===');
        
        return 0;
    }
}
