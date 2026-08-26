<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BackupController extends Controller
{
    /**
     * Mostrar formulario de carga de backup
     */
    public function index()
    {
        $backups = [];
        $backupDir = storage_path('app/backups');
        
        if (is_dir($backupDir)) {
            $files = glob($backupDir . '/documents_backup_*.zip');
            
            foreach ($files as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => filesize($file),
                    'size_mb' => round(filesize($file) / 1048576, 2),
                    'date' => date('d/m/Y H:i', filemtime($file)),
                ];
            }
        }
        
        return inertia('Settings/Backups', [
            'backups' => $backups
        ]);
    }
    
    /**
     * Subir backup desde el navegador
     */
    public function upload(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:zip|max:102400' // Máximo 100MB
        ]);
        
        $file = $request->file('backup_file');
        $fileName = 'documents_backup_' . date('Y-m-d_His') . '.zip';
        
        // Guardar en storage/app/backups
        $file->storeAs('backups', $fileName);
        
        return redirect()->back()->with('success', 'Backup subido exitosamente: ' . $fileName);
    }
    
    /**
     * Restaurar backup
     */
    public function restore($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        
        if (!file_exists($backupPath)) {
            return redirect()->back()->with('error', 'Backup no encontrado');
        }
        
        $zip = new ZipArchive();
        
        if ($zip->open($backupPath) !== true) {
            return redirect()->back()->with('error', 'No se pudo abrir el archivo ZIP');
        }
        
        // Extraer a storage/app/public
        $extractPath = storage_path('app/public');
        $zip->extractTo($extractPath);
        $zip->close();
        
        return redirect()->back()->with('success', 'Backup restaurado exitosamente. Los documentos están disponibles nuevamente.');
    }
    
    /**
     * Eliminar backup
     */
    public function delete($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        
        if (file_exists($backupPath)) {
            unlink($backupPath);
            return redirect()->back()->with('success', 'Backup eliminado');
        }
        
        return redirect()->back()->with('error', 'Backup no encontrado');
    }
}
