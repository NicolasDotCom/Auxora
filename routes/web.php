<?php

use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ApiTokenManagerController;
use App\Http\Controllers\ApiTicketsDemoController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\PendingPartController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

// Landing pública: siempre va a /welcome. En modo demo muestra 1-click
// login + registro público; sin modo demo, muestra solo el login clásico.
Route::get('/', function () {
    return redirect()->route('demo.welcome');
})->name('home');

// /welcome es siempre accesible (renderiza distinto según APP_DEMO).
Route::get('/welcome', [DemoController::class, 'welcome'])->name('demo.welcome');

// 1-click demo login: SOLO accesible cuando APP_DEMO=true (seguridad).
Route::middleware('demo')->group(function () {
    Route::get('/demo/login/{role}', [DemoController::class, 'loginAs'])
        ->where('role', 'admin|Coordinador|support|customer')
        ->name('demo.login-as');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Rutas accesibles para todos los usuarios autenticados
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/tickets/{ticket}/duplicate', [TicketController::class, 'duplicate'])
        ->name('tickets.duplicate');
    Route::get('/tickets/{ticket}/reporte-visita', [TicketController::class, 'createVisitReport'])
        ->name('tickets.reporte-visita.form');
    Route::post('/tickets/{ticket}/reporte-visita', [TicketController::class, 'storeVisitReport'])
        ->name('tickets.reporte-visita.store');
    Route::post('/tickets/{ticket}/reporte-visita/store-and-comment', [TicketController::class, 'storeVisitReportAndComment'])
        ->name('tickets.reporte-visita.store-and-comment');
    Route::resource('tickets', TicketController::class);
    
    // Rutas para documentos de tickets
    Route::get('/ticket-documents/{document}/download', [TicketController::class, 'downloadDocument'])
        ->name('ticket-documents.download');
    Route::delete('/ticket-documents/{document}', [TicketController::class, 'deleteDocument'])
        ->name('ticket-documents.destroy');
    
    // Ruta para actualizar solo el estado del ticket (soporte técnico)
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus'])
        ->name('tickets.update-status');
    
    // Rutas para comentarios en tickets
    Route::post('/tickets/{ticket}/comments', [TicketController::class, 'storeComment'])
        ->name('tickets.comments.store');
    Route::get('/comment-attachments/{attachment}/download', [TicketController::class, 'downloadCommentAttachment'])
        ->name('comment-attachments.download');
    
    // Vista de repuestos pendientes: todos los roles excepto Comercial y customer
    Route::get('/pending-parts', [PendingPartController::class, 'index'])->name('pending-parts.index');

    // Acciones de repuestos pendientes: solo admin, support y Coordinador
    Route::middleware('role:admin|support|Coordinador')->group(function () {
        Route::post('/pending-parts', [PendingPartController::class, 'store'])->name('pending-parts.store');
        Route::patch('/pending-parts/{pendingPart}/status', [PendingPartController::class, 'updateStatus'])->name('pending-parts.update-status');
        Route::patch('/pending-parts/ticket/{ticket}/complete-all', [PendingPartController::class, 'completeAllByTicket'])
            ->name('pending-parts.complete-all');
        Route::patch('/pending-parts/close-all-open', [PendingPartController::class, 'closeAllPending'])
            ->name('pending-parts.close-all-open');
    });

    // Estadísticas de técnicos - permiso: view analytics
    Route::middleware('permission:view analytics')->group(function () {
        Route::get('/analytics/technicians', [DashboardController::class, 'getTechnicianAnalytics'])->name('analytics.technicians');
        Route::get('/analytics/technicians/export-pdf', [DashboardController::class, 'exportRankingPdf'])->name('analytics.technicians.export-pdf');
    });

    // Estadísticas de tickets - permiso: stats analytics
    Route::middleware('permission:stats analytics')->group(function () {
        Route::get('/analytics/tickets', [DashboardController::class, 'getTicketStats'])->name('analytics.tickets');
        Route::get('/analytics/tickets/export-excel', [DashboardController::class, 'exportTicketStatsExcel'])->name('analytics.tickets.export-excel');
        Route::get('/analytics/tickets/export-pdf', [DashboardController::class, 'exportTicketStatsPdf'])->name('analytics.tickets.export-pdf');
    });

    // Exportación de tickets - permiso: export analytics
    Route::middleware('permission:export analytics')->group(function () {
        Route::get('/export-tickets', [DashboardController::class, 'exportView'])->name('export-tickets.view');
        Route::get('dashboard/export-tickets', [DashboardController::class, 'exportTickets'])->name('dashboard.export-tickets');
        Route::get('dashboard/export-tickets-pdf', [DashboardController::class, 'exportTicketsPdf'])->name('dashboard.export-tickets-pdf');
    });

    // Demo de API de tickets
    Route::get('/api-demo/tickets', [ApiTicketsDemoController::class, 'index'])
        ->middleware('permission:view api')
        ->name('api-demo.tickets');

    // Administrador de tokens API
    Route::middleware('permission:manage api')->group(function () {
        Route::get('/settings/api-tokens', [ApiTokenManagerController::class, 'index'])
            ->name('api-tokens.index');
        Route::post('/settings/api-tokens', [ApiTokenManagerController::class, 'store'])
            ->name('api-tokens.store');
        Route::delete('/settings/api-tokens/{token}', [ApiTokenManagerController::class, 'destroy'])
            ->name('api-tokens.destroy');
    });
});

// Rutas accesibles para usuarios autenticados con permisos específicos
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('customers', CustomerController::class);
    Route::resource('supports', SupportController::class);
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function (){
    // Gestión de días festivos
    Route::get('/settings/holidays', [HolidayController::class, 'index'])->name('holidays.index');
    Route::post('/settings/holidays', [HolidayController::class, 'store'])->name('holidays.store');
    Route::put('/settings/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
    Route::delete('/settings/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
    
    // Gestión de Backups (interfaz web)
    Route::get('/settings/backups', [BackupController::class, 'index'])->name('backups.index');
    Route::post('/settings/backups/upload', [BackupController::class, 'upload'])->name('backups.upload');
    Route::post('/settings/backups/{filename}/restore', [BackupController::class, 'restore'])->name('backups.restore');
    Route::delete('/settings/backups/{filename}', [BackupController::class, 'delete'])->name('backups.delete');
    
    // Backup de documentos (API)
    Route::get('/backup/download/{filename}', function ($filename) {
        $backupPath = storage_path('app/backups/' . $filename);
        
        if (!file_exists($backupPath)) {
            abort(404, 'Backup no encontrado');
        }
        
        return response()->download($backupPath);
    })->where('filename', 'documents_backup_.*\.zip')->name('backup.download');
    
    Route::get('/backup/list', function () {
        $backupDir = storage_path('app/backups');
        $backups = [];
        
        if (is_dir($backupDir)) {
            $files = glob($backupDir . '/documents_backup_*.zip');
            
            foreach ($files as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => filesize($file),
                    'size_mb' => round(filesize($file) / 1048576, 2),
                    'date' => date('d/m/Y H:i', filemtime($file)),
                    'download_url' => route('backup.download', basename($file))
                ];
            }
        }
        
        return response()->json([
            'backups' => $backups,
            'total' => count($backups)
        ], 200, [], JSON_PRETTY_PRINT);
    })->name('backup.list');
    
    // Diagnóstico de documentos (solo admin)
    Route::get('/diagnose/storage', function () {
        $disk = Storage::disk('public');
        $documents = \App\Models\TicketDocument::all();
        
        $info = [
            'storage_config' => [
                'root_path' => $disk->path(''),
                'url' => config('filesystems.disks.public.url'),
                'app_url' => config('app.url'),
            ],
            'symlink' => [
                'public_path' => public_path('storage'),
                'storage_path' => storage_path('app/public'),
                'exists' => is_link(public_path('storage')),
                'target' => is_link(public_path('storage')) ? readlink(public_path('storage')) : 'No existe',
            ],
            'documents_folder' => [
                'relative_path' => 'ticket-documents',
                'absolute_path' => $disk->path('ticket-documents'),
                'exists' => $disk->exists('ticket-documents'),
                'files_count' => $disk->exists('ticket-documents') ? count($disk->files('ticket-documents')) : 0,
            ],
            'database' => [
                'total_documents' => $documents->count(),
                'missing_files' => 0,
                'found_files' => 0,
                'missing_list' => [],
            ],
        ];
        
        // Verificar cada documento
        foreach ($documents as $doc) {
            if ($disk->exists($doc->file_path)) {
                $info['database']['found_files']++;
            } else {
                $info['database']['missing_files']++;
                if (count($info['database']['missing_list']) < 20) {
                    $info['database']['missing_list'][] = [
                        'id' => $doc->id,
                        'ticket_id' => $doc->ticket_id,
                        'original_name' => $doc->original_name,
                        'file_path' => $doc->file_path,
                        'absolute_path' => $disk->path($doc->file_path),
                    ];
                }
            }
        }
        
        return response()->json($info, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    })->name('diagnose.storage');
    
    //roles
    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');

    //permisos
    Route::get('/users/roles', [UserRoleController::class, 'index'])->name('users.roles.index');
    Route::put('/users/roles', [UserRoleController::class, 'update'])->name('users.roles.update');

    Route::resource('users', UserController::class);
    Route::post('/users/{user}/verify', [UserController::class, 'verifyUser'])->name('users.verify');

    // Registro habilitado solo para admin (modo normal)
    if (! config('app.demo.enabled')) {
        Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
        Route::post('/register', [RegisteredUserController::class, 'store']);
    }
});

// Registro público en modo demo: rate limit 3 por IP/hora + honeypot en el form
if (config('app.demo.enabled')) {
    Route::middleware('throttle:3,60')->group(function () {
        Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
        Route::post('/register', [RegisteredUserController::class, 'store']);
    });
}


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
