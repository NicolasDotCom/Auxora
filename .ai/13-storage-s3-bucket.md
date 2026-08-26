# 🪣 13 — Almacenamiento en Bucket S3 (Laravel Cloud)

> En producción, todos los archivos del sistema se almacenan en un **bucket S3 managed por Laravel Cloud**. Esto garantiza **persistencia** (los archivos nunca se borran entre deploys) y **escalabilidad** automática.

---

## 🎯 ¿Por qué S3 y no disco local?

| Aspecto | Disco Local | Bucket S3 |
|---------|-------------|-----------|
| **Persistencia** | ❌ Se borra en cada redeploy | ✅ Permanente |
| **Escalabilidad** | ❌ Limitado al disco del servidor | ✅ Ilimitado |
| **Acceso** | ❌ Solo desde el servidor | ✅ URLs firmadas, CDN |
| **Backups** | ❌ Manual | ✅ Automático (versionado) |
| **Costo** | Incluido | Incluido en Laravel Cloud |

> **Laravel Cloud incluye S3** sin costos adicionales. El bucket, credenciales y región se gestionan automáticamente.

---

## 📁 Estructura del Bucket

```
s3://laravel-cloud-bucket/
├── ticket-documents/
│   ├── {ticket_id}/
│   │   ├── abc123-factura.pdf
│   │   ├── def456-foto-equipo.jpg
│   │   └── ...
│   └── ...
├── comment-attachments/
│   ├── {ticket_id}/
│   │   ├── xyz789-log.txt
│   │   └── ...
│   └── ...
└── backups/
    ├── documents_backup_2026-01-15.zip
    ├── documents_backup_2026-01-22.zip
    └── ...
```

> Los archivos se organizan por **ticket_id** para mantener orden y facilitar limpieza futura.

---

## ⚙️ Configuración

### En Laravel Cloud (automático)

Las siguientes variables están **preconfiguradas** en Laravel Cloud:

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<provisto por Laravel Cloud>
AWS_SECRET_ACCESS_KEY=<provisto por Laravel Cloud>
AWS_DEFAULT_REGION=<óptima según ubicación>
AWS_BUCKET=<nombre del bucket managed>
```

**No necesitas crear el bucket manualmente** — Laravel Cloud lo aprovisiona automáticamente.

### En `config/filesystems.php`

```php
return [
    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
            'visibility' => 'public',
        ],
    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
```

> En producción, `default` debe ser `s3` (vía `FILESYSTEM_DISK=s3`).

---

## 📤 Subir Archivos a S3

### Patrón Estándar (recomendado)

```php
use Illuminate\Support\Facades\Storage;

public function storeDocument(Request $request, Ticket $ticket)
{
    $request->validate([
        'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB
    ]);

    DB::transaction(function () use ($request, $ticket) {
        $file = $request->file('document');
        $fileName = $file->getClientOriginalName();

        // ✅ Subir a S3 (Laravel Cloud maneja automáticamente)
        $path = $file->storeAs(
            "ticket-documents/{$ticket->id}",
            Str::uuid() . '-' . $fileName,
            config('filesystems.default')  // Usa el disco configurado (s3 en prod)
        );

        $ticket->documents()->create([
            'file_name' => $fileName,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => auth()->id(),
        ]);

        $ticket->histories()->create([
            'user_id' => auth()->id(),
            'action' => 'document_added',
            'description' => "Documento agregado: {$fileName}",
        ]);
    });

    return back()->with('success', 'Documento subido');
}
```

### Múltiples Archivos

```php
if ($request->hasFile('documents')) {
    foreach ($request->file('documents') as $file) {
        $path = $file->storeAs(
            "ticket-documents/{$ticket->id}",
            Str::uuid() . '-' . $file->getClientOriginalName(),
            config('filesystems.default')  // 's3' en prod, 'public'/'local' en dev
        );
        // ...
    }
}
```

---

## 📥 Descargar Archivos desde S3

### Patrón Recomendado

```php
public function downloadDocument(TicketDocument $document)
{
    // 1. Verificar autorización
    $this->authorizeAccess($document->ticket);

    // 2. Verificar que el archivo existe en S3
    if (!Storage::disk(config('filesystems.default'))->exists($document->file_path)) {
        abort(404, 'Archivo no encontrado en el storage');
    }

    // 3. Descargar
    return Storage::disk(config('filesystems.default'))->download(
        $document->file_path,
        $document->file_name  // Nombre con el que se descargará
    );
}
```

---

## 🌐 URLs Públicas vs Firmadas

### URLs Públicas (acceso directo)

```php
// Útil para mostrar previews en <img> o <a href>
$url = Storage::disk('s3')->url($document->file_path);
// https://bucket.s3.region.amazonaws.com/ticket-documents/123/abc-factura.pdf
```

⚠️ **Solo usar** cuando el archivo NO contiene datos sensibles.

### URLs Firmadas (acceso temporal)

```php
// Para documentos sensibles (facturas, datos de clientes)
$tempUrl = Storage::disk('s3')->temporaryUrl(
    $document->file_path,
    now()->addMinutes(5)  // Válida por 5 minutos
);
// https://bucket.s3.region.amazonaws.com/ticket-documents/123/abc-factura.pdf
//   ?X-Amz-Algorithm=...
//   &X-Amz-Expires=300
//   &X-Amz-Signature=...
```

### Modelo `TicketDocument` (acceso dinámico)

```php
// app/Models/TicketDocument.php

use Illuminate\Support\Facades\Storage;

public function getFileUrlAttribute(): string
{
    // ✅ Funciona con cualquier driver (local o S3)
    return Storage::disk(config('filesystems.default'))->url($this->file_path);
}

public function getTemporaryUrl(int $minutes = 5): string
{
    // Solo funciona con S3
    return Storage::disk('s3')->temporaryUrl(
        $this->file_path,
        now()->addMinutes($minutes)
    );
}
```

Uso en React:
```tsx
<a href={ticket.document.file_url} target="_blank">Ver</a>
<a href={ticket.document.temporary_url}>Ver seguro</a>
```

---

## 🗑️ Eliminar Archivos

```php
public function deleteDocument(TicketDocument $document)
{
    $this->authorizeAccess($document->ticket);

    DB::transaction(function () use ($document) {
        // Eliminar de S3
        Storage::disk(config('filesystems.default'))->delete($document->file_path);

        // Eliminar de BD
        $document->delete();
    });

    return back()->with('success', 'Documento eliminado');
}
```

---

## 🔄 Migración de Local a S3

Si ya tienes archivos en `local` antes de activar S3:

### Comando Incluido

```bash
# Previsualizar (no ejecuta cambios)
php artisan files:migrate-to-s3 --dry-run

# Ejecutar migración real
php artisan files:migrate-to-s3
```

```php
// app/Console/Commands/MigrateFilesToS3.php
class MigrateFilesToS3 extends Command
{
    protected $signature = 'files:migrate-to-s3 {--dry-run : Solo simular}';
    protected $description = 'Migra archivos de local a S3';

    public function handle()
    {
        $documents = TicketDocument::all();
        $dryRun = $this->option('dry-run');
        $migrated = 0;

        foreach ($documents as $document) {
            $localPath = storage_path('app/public/' . $document->file_path);

            if (file_exists($localPath)) {
                if (!$dryRun) {
                    Storage::disk('s3')->put(
                        $document->file_path,
                        file_get_contents($localPath)
                    );
                }
                $this->info("✓ {$document->file_name}");
                $migrated++;
            } else {
                $this->warn("✗ No encontrado: {$document->file_name}");
            }
        }

        $this->info("Total migrados: {$migrated}");
    }
}
```

---

## 📦 Backups de Documentos

El sistema genera backups ZIP de todos los documentos en S3:

```php
// app/Console/Commands/BackupDocuments.php
class BackupDocuments extends Command
{
    protected $signature = 'documents:backup';
    protected $description = 'Genera un ZIP con todos los documentos';

    public function handle()
    {
        $disk = Storage::disk('s3');
        $files = $disk->allFiles('ticket-documents');

        $zipName = 'documents_backup_' . now()->format('Y-m-d_His') . '.zip';
        $zipPath = storage_path('app/backups/' . $zipName);

        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::CREATE);

        foreach ($files as $file) {
            $content = $disk->get($file);
            $zip->addFromString($file, $content);
        }

        $zip->close();

        // Subir el ZIP también a S3
        $disk->put('backups/' . $zipName, file_get_contents($zipPath));

        $this->info("Backup creado: {$zipName}");
    }
}
```

Programar en `routes/console.php`:
```php
Schedule::command('documents:backup')->weekly();
```

---

## 🔒 Seguridad en S3

### Archivos Privados vs Públicos

```php
// Subir como privado
$path = $file->storeAs(
    'private-documents',
    $fileName,
    ['disk' => 's3', 'visibility' => 'private']
);

// Generar URL temporal para acceder
$tempUrl = Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(5));
```

### Validar Tipo de Archivo

```php
// Siempre validar en Form Request
$request->validate([
    'document' => [
        'required',
        'file',
        'mimes:pdf,jpg,jpeg,png,doc,docx',
        'max:10240',  // 10 MB
    ],
]);
```

### Limitar Tamaño

```php
// config/filesystems.php o .env
'max_file_size' => env('MAX_UPLOAD_SIZE', 10240), // KB
```

---

## 🎯 Mejores Prácticas

### ✅ SÍ

```php
// ✅ Usar el disco configurado (funciona en local y prod)
Storage::disk(config('filesystems.default'))->put($path, $content);

// ✅ Usar nombres únicos para evitar colisiones
$path = $file->storeAs(
    "ticket-documents/{$ticket->id}",
    Str::uuid() . '-' . $file->getClientOriginalName(),
    config('filesystems.default')
);

// ✅ Verificar existencia antes de descargar
if (!Storage::disk(config('filesystems.default'))->exists($path)) {
    abort(404);
}

// ✅ Usar URLs firmadas para archivos sensibles
$tempUrl = Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(5));

// ✅ Eliminar de S3 al eliminar de BD
Storage::disk(config('filesystems.default'))->delete($document->file_path);
$document->delete();
```

### ❌ NO

```php
// ❌ Hardcodear el disco
Storage::disk('s3')->put(...);  // ❌ Falla en local con FILESYSTEM_DISK=local

// ❌ Usar nombre original del archivo (puede tener caracteres raros)
$file->storeAs('docs', $file->getClientOriginalName());

// ❌ Guardar ruta absoluta en BD
'file_path' => storage_path('app/public/...');  // ❌

// ❌ Dejar archivos huérfanos en S3
$document->delete();  // Sin eliminar de S3 ❌

// ❌ URLs públicas para datos sensibles
Storage::disk('s3')->url($facturaPath);  // ❌ Usar temporaryUrl
```

---

## 🐛 Troubleshooting

### Error: "Class 'League\Flysystem\AwsS3V3\AwsS3V3Adapter' not found"

```bash
composer require league/flysystem-aws-s3-v3 "^3.0"
composer dump-autoload
```

### Error: "Credentials could not be loaded"

Verificar en Laravel Cloud → Environment Variables:
- `AWS_ACCESS_KEY_ID` configurada
- `AWS_SECRET_ACCESS_KEY` configurada
- `AWS_BUCKET` configurada

### Error: "The bucket does not allow ACLs"

En AWS S3: **Bucket → Permissions → Object Ownership → Edit → ACLs enabled**.

(En Laravel Cloud esto viene pre-configurado, no deberías verlo.)

### Error: "File not found" al descargar

```bash
# Diagnosticar
php artisan tinker
> Storage::disk('s3')->exists('ticket-documents/123/abc.pdf')
> Storage::disk('s3')->allFiles('ticket-documents/123')
```

### Archivos no aparecen en producción

```bash
# 1. Verificar que FILESYSTEM_DISK=s3
php artisan tinker
> config('filesystems.default')
=> "s3"  # Debe ser s3

# 2. Verificar credenciales
> Storage::disk('s3')->url('test.txt')

# 3. Si acabas de cambiar de local a s3, migrar:
php artisan files:migrate-to-s3
```

---

## 📊 Monitoreo de S3

### Ver tamaño del bucket

```bash
php artisan tinker
> $size = 0;
> foreach (Storage::disk('s3')->allFiles() as $file) {
>     $size += Storage::disk('s3')->size($file);
> }
> return round($size / 1024 / 1024, 2) . ' MB';
```

### Contar archivos por carpeta

```php
$tickets = count(Storage::disk('s3')->allFiles('ticket-documents'));
$comments = count(Storage::disk('s3')->allFiles('comment-attachments'));
$backups = count(Storage::disk('s3')->allFiles('backups'));
```

---

## 📚 Referencias Internas

- `12-deployment-laravel-cloud.md` — Setup completo de Laravel Cloud
- `S3_STORAGE_SETUP.md` (raíz) — Guía detallada de S3
- `LARAVEL_CLOUD_STORAGE.md` (raíz) — Storage específico en Laravel Cloud
- `S3_COMANDOS.md` (raíz) — Comandos útiles para S3

---

## 🔗 Documentación Externa

- [Laravel Filesystem Docs](https://laravel.com/docs/filesystem)
- [Laravel Cloud Storage](https://laravel.com/cloud/docs#storage)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

---

**Versión**: 1.0  
**Bucket**: Managed por Laravel Cloud  
**Persistencia**: ✅ Garantizada entre deploys  
**Última actualización**: Enero 2026
