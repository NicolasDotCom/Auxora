# Almacenamiento de Archivos

## Problema: archivos efímeros

En producción con contenedores Docker (Coolify, ECS, Heroku, etc.) el sistema de archivos local es **efímero**: los archivos subidos se eliminan tras redeploys o al recrear el contenedor. **Solución:** almacenamiento en la nube o volumen persistente.

## Opciones recomendadas para VPS con Coolify

### MinIO (S3 self-hosted, recomendado)

Coolify ofrece MinIO como recurso de un click. Configuración:

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<provisto por Coolify>
AWS_SECRET_ACCESS_KEY=<provisto por Coolify>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=tickets
AWS_ENDPOINT=http://minio:9000
AWS_URL=https://auxora.homelabvps.dev
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Coolify gestiona el acceso interno entre contenedores y la persistencia del bucket en un volumen Docker.

### S3 externo o compatible

Si prefieres usar un bucket externo (Amazon S3, Cloudflare R2, DigitalOcean Spaces), configura las variables en Coolify → Environment Variables. El servidor hace las peticiones a través del endpoint público, lo que añade latencia pero desacopla el almacenamiento del VPS.

## Proveedores alternativos

### Amazon S3 (~0.023 USD/GB/mes)

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=nombre-bucket
AWS_URL=https://nombre-bucket.s3.amazonaws.com
```

Crear usuario IAM con policy `AmazonS3FullAccess` y generar Access Keys.

### DigitalOcean Spaces (5 USD/mes fijo, 250GB)

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=spaces_key
AWS_SECRET_ACCESS_KEY=spaces_secret
AWS_DEFAULT_REGION=nyc3
AWS_BUCKET=nombre-space
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_URL=https://nombre-space.nyc3.digitaloceanspaces.com
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### Cloudflare R2 (transferencia gratis)

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=r2_key
AWS_SECRET_ACCESS_KEY=r2_secret
AWS_DEFAULT_REGION=auto
AWS_BUCKET=nombre-bucket
AWS_ENDPOINT=https://account_id.r2.cloudflarestorage.com
AWS_URL=https://tu-dominio.r2.dev
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## Configuración local

Para desarrollo mantener almacenamiento local:

```env
FILESYSTEM_DISK=local
```

Crear enlace simbólico para acceso público:

```bash
php artisan storage:link
```

## Migrar archivos existentes a S3

Si ya tienes archivos en local y quieres moverlos a S3 sin perder nada:

```bash
# Simular primero (no modifica nada)
php artisan files:migrate-to-s3 --dry-run

# Migrar todo
php artisan files:migrate-to-s3

# Solo documentos de tickets
php artisan files:migrate-to-s3 --type=documents

# Solo adjuntos de comentarios
php artisan files:migrate-to-s3 --type=attachments
```

## Verificar estado

```bash
php artisan tinker

# Configuración actual
>>> config('filesystems.default')
=> "s3"

# Probar conexión
>>> Storage::disk('s3')->exists('test.txt')

# Listar archivos
>>> Storage::disk('s3')->files('ticket-documents')

# URL de un documento
>>> $doc = \App\Models\TicketDocument::first()
>>> $doc->file_url
```

## Estructura de carpetas en S3

```
bucket/
├── ticket-documents/        # Documentos adjuntos a tickets
└── comment-attachments/    # Adjuntos en comentarios
```

## Problemas comunes

### "El archivo no existe" al descargar

1. Verificar que `php artisan storage:link` se ejecutó (solo local).
2. Verificar permisos: `chmod -R 775 storage` (Linux).
3. En S3: verificar que `FILESYSTEM_DISK=s3` está en producción.
4. Verificar que el bucket existe y las credenciales son correctas.

### "Class 'League\Flysystem\AwsS3V3\AwsS3V3Adapter' not found"

```bash
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
composer dump-autoload
```

### "Credentials could not be loaded"

Verificar `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` en variables de entorno de producción.

### "The bucket does not allow ACLs"

S3 → Bucket → Permissions → Object Ownership → **ACLs enabled**.

### Archivos no se ven desde navegador

Configurar CORS en el bucket:

```json
[{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://homelabvps.dev"],
    "ExposeHeaders": []
}]
```

## Costos

| Proveedor | Costo | Ventaja |
|-----------|-------|---------|
| Amazon S3 | ~$0.023/GB/mes | Popular, integra con CloudFront |
| DigitalOcean Spaces | $5/mes (250GB) | Precio fijo |
| Cloudflare R2 | $0.015/GB | Transferencia gratis |
| Coolify + MinIO | Incluido en el VPS | Persistente, sin coste extra |
| Coolify + S3 externo | Coste del proveedor | Desacoplado del VPS |

## Backup

```bash
# Backup de documentos en ZIP (solo admin)
php artisan backup:documents

# Listar backups disponibles
ls -la storage/app/backups/
```

Desde la interfaz web: `/settings/backups` (solo admin).
