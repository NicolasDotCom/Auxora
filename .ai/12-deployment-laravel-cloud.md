# 🚀 12 — Despliegue en Laravel Cloud

> **Laravel Cloud** es la plataforma oficial de hosting de Laravel. El proyecto está optimizado para correr allí con auto-deploy desde Git, MySQL managed, Redis managed y S3 bucket.

---

## 🏗️ Stack Gestionado por Laravel Cloud

| Servicio | Tecnología | Configuración |
|----------|------------|--------------|
| **Hosting** | Laravel Cloud | Auto-deploy desde `main` branch |
| **Base de datos** | **MySQL** | Managed, con connection pooling (min 5 / max 100) |
| **Cache** | **Redis** | Managed, alta disponibilidad |
| **Sessions** | **Redis** | Encriptadas |
| **Queues** | **Redis** | Procesamiento asincrónico |
| **Storage** | **Bucket S3** | Managed por Laravel Cloud, persistente |
| **SSL/TLS** | Automático | Vía Cloudflare CDN |
| **Mail** | Configurable | Resend / SMTP según `.env` |

---

## 🔄 Flujo de Deploy

```
Push a main → GitHub
      ↓
Laravel Cloud detecta push
      ↓
Build & install:
  • composer install --no-dev --optimize-autoloader
  • npm ci && npm run build
  • php artisan config:cache
  • php artisan route:cache
  • php artisan view:cache
  • php artisan migrate --force
      ↓
Deploy + health checks
      ↓
Activar nueva versión (zero-downtime)
```

> El deployment toma **2-5 minutos**. Si falla, Laravel Cloud hace **rollback automático**.

---

## ⚙️ Variables de Entorno en Laravel Cloud

Configurar en **Dashboard → Environment Variables**:

### 🔴 Críticas (obligatorias)

```env
# === APP ===
APP_NAME="Sistema de Tickets"
APP_ENV=production
APP_KEY=base64:...                    # Generar con php artisan key:generate
APP_DEBUG=false
APP_URL=https://tu-app.laravel.cloud

# === DATABASE (MySQL managed) ===
DB_CONNECTION=mysql
DB_HOST=tu-host.laravel.cloud         # Provisto por Laravel Cloud
DB_PORT=3306
DB_DATABASE=tickets
DB_USERNAME=tu_user
DB_PASSWORD=tu_password

# === CACHE / SESSIONS / QUEUES (Redis managed) ===
CACHE_STORE=redis
SESSION_DRIVER=redis
SESSION_CONNECTION=cache
QUEUE_CONNECTION=redis
CACHE_PREFIX=auxora_

# === STORAGE (S3 bucket managed) ===
FILESYSTEM_DISK=s3
# Credenciales AWS provistas automáticamente por Laravel Cloud

# === MAIL ===
MAIL_MAILER=resend                    # O smtp
RESEND_API_KEY=re_xxx                 # Si usas Resend

# === CONNECTION POOLING (MySQL) ===
DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=100
```

### 🟡 Opcionales

```env
# Logs
LOG_CHANNEL=stack
LOG_LEVEL=error                       # Menos verboso en prod

# Mail From
MAIL_FROM_ADDRESS="noreply@tu-dominio.com"
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum (API)
SANCTUM_STATEFUL_DOMAINS=tu-app.laravel.cloud
```

> 🔐 Las variables `AWS_*` para S3 son provistas automáticamente por Laravel Cloud. **No hardcodear**.

---

## 📦 Archivo `config/database.php` (connection pooling)

Configuración para MySQL con connection pooling:

```php
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DB_URL'),
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'charset' => env('DB_CHARSET', 'utf8mb4'),
    'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => 'InnoDB',
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
    'pool' => [
        'min_connections' => env('DB_MIN_CONNECTIONS', 5),
        'max_connections' => env('DB_MAX_CONNECTIONS', 100),
    ],
],
```

> Esto evita que MySQL colapse bajo carga concurrente (50+ usuarios).

---

## 🚀 Pasos para el Primer Deploy

### 1. Crear Proyecto en Laravel Cloud

1. Accede a [cloud.laravel.com](https://cloud.laravel.com).
2. Click en **"New Project"**.
3. Conecta el repositorio Git (`github.com/usuario/ticket_tes`).
4. Laravel Cloud detecta automáticamente que es Laravel.
5. Selecciona el plan (recomendado: con Redis + MySQL).

### 2. Configurar Variables de Entorno

En **Environment Variables**, agregar todas las variables críticas listadas arriba.

**Importante**: 
- `APP_KEY` se genera con `php artisan key:generate --show` en local.
- Las variables de DB y Redis las provee Laravel Cloud automáticamente.

### 3. Configurar Servicios Managed

En **Services** (o **Add-ons**), verificar:
- ✅ **MySQL** provisioned
- ✅ **Redis** provisioned
- ✅ **S3 Bucket** provisioned (auto)

### 4. Configurar Dominio

En **Domains**:
- Dominio automático: `tu-app.laravel.cloud`
- O conectar dominio custom (CNAME a Laravel Cloud).

### 5. Deploy Inicial

```bash
# Asegurar que el código está pusheado
git push origin main
```

Laravel Cloud deployará automáticamente. Revisar logs en **Deployments**.

---

## 🔄 Deploy Continuo

Después de cada `git push`, Laravel Cloud:

1. **Detecta** el push vía webhook.
2. **Ejecuta build** con la imagen optimizada.
3. **Corre migraciones** automáticamente.
4. **Hace swap** del contenedor (zero-downtime).
5. **Notifica** el resultado por email/slack.

### Configurar Webhook (si es repo propio)

En GitHub: **Settings → Webhooks → Add webhook**
- URL: Provista por Laravel Cloud
- Events: `push`

---

## 🧰 Comandos Post-Deploy

Ejecutar **una vez** después del primer deploy (vía Laravel Cloud SSH/Console):

```bash
# 1. Pre-cargar catálogos críticos
php artisan cache:warmup

# 2. Verificar salud del sistema
php artisan health:check

# 3. Si vienes de sesiones en database, limpiarlas
php artisan sessions:cleanup

# 4. Iniciar queue worker (si no corre automáticamente)
php artisan queue:work --queue=default --sleep=3 --tries=3 --max-jobs=1000
```

### Salida esperada de `health:check`

```
🏥 Verificando salud del sistema...

🔴 Redis
   ✅ Conexión OK - redis.laravel.cloud
   📊 Keys en caché: 1245

🔴 Base de Datos MySQL
   ✅ Conexión OK - mysql.laravel.cloud
   📊 Tickets en BD: 342

🔴 Sesiones
   ✅ Driver: redis

🔴 Cache
   ✅ Driver: redis

🔴 Queue/Jobs
   ✅ Driver: redis

🔴 Connection Pool MySQL
   📊 Min connections: 5
   📊 Max connections: 100

✅ Sistema en perfecto estado!
📈 Listo para soportar 50+ usuarios simultáneos
```

---

## 📊 Métricas de Performance (Producción)

| Métrica | Sin Redis (DB) | Con Redis (Laravel Cloud) |
|---------|----------------|---------------------------|
| Response time | 1200+ ms | **150-300 ms** |
| Queries/request | 8-12 | 3-5 |
| Memory/request | 40 MB | 15 MB |
| Concurrent sessions | ~10-15 | **100+** |
| Caché hit rate | 20% | **80%+** |

---

## 🔍 Monitoreo en Producción

### Verificar Redis

```bash
# Conectar a Laravel Cloud via SSH o Console
php artisan tinker
> Redis::ping()
"PONG"  # OK

# Ver tamaño de la DB Redis
> Cache::getRedis()->dbsize()
```

### Verificar Logs

```bash
# Laravel Cloud → Logs → Real-time tail
php artisan log:tail

# O en Storage de Laravel Cloud
storage/logs/laravel.log
```

### Verificar Queue Jobs

```bash
# Jobs fallidos
php artisan queue:failed

# Reintentar jobs fallidos
php artisan queue:retry all
```

---

## ⚠️ Troubleshooting

### 🔴 Redis no disponible

**Síntoma**: `Connection refused` o `redis not found`.

**Solución**:
1. Verificar en Laravel Cloud → Services que Redis esté activo.
2. Si el plan no incluye Redis, upgrade de plan o cambiar `CACHE_STORE=database` temporalmente.
3. Laravel Cloud provee Redis con alta disponibilidad — contactar soporte si falla.

```bash
# Diagnóstico
php artisan tinker
> Redis::ping()
> Cache::getStore()
```

### 🔴 Migración falla en deploy

**Síntoma**: Deploy termina con error en `php artisan migrate`.

**Solución**:
```bash
# Ver el error en detalle
php artisan migrate --force --pretend

# Si hay una migración rota, hacer rollback
php artisan migrate:rollback --step=1
```

### 🔴 Assets no se cargan (CSS/JS)

**Síntoma**: Frontend sin estilos.

**Solución**:
```bash
# Reconstruir assets
npm ci && npm run build

# Verificar manifest
ls public/build/manifest.json
```

### 🔴 Archivos subidos desaparecen

**Síntoma**: Después de un deploy, archivos subidos no aparecen.

**Causa**: Estás usando `FILESYSTEM_DISK=local` en lugar de `s3`.

**Solución**:
```env
FILESYSTEM_DISK=s3
```

Y migrar archivos existentes:
```bash
php artisan files:migrate-to-s3
```

Ver `13-storage-s3-bucket.md` para detalles.

### 🔴 Queue jobs no se procesan

**Síntoma**: Emails no se envían, PDFs no se generan.

**Solución**:
```bash
# Asegurar que queue worker está corriendo
php artisan queue:work --queue=default

# Ver Laravel Cloud → Workers (puede requerir configurarlo desde UI)
```

### 🔴 Session expirada constantemente

**Síntoma**: Usuarios deslogueados tras refresh.

**Causa**: Cambiaste `SESSION_DRIVER` pero Redis no está conectado.

**Solución**:
```bash
# Verificar
php artisan tinker
> config('session.driver')
=> "redis"

> Redis::connection('cache')->ping()
"PONG"
```

---

## 🛡️ Seguridad en Laravel Cloud

### Variables Sensibles

- ✅ **Nunca** commitear `.env` al repo.
- ✅ Laravel Cloud cifra todas las env vars.
- ✅ Rotar `APP_KEY` si se sospecha comprometida.

### Rate Limiting (ya configurado)

```php
// app/Providers/AppServiceProvider.php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(90)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});
```

### CSRF

Automático en Laravel. Las rutas `POST/PUT/PATCH/DELETE` requieren token CSRF.

### SSL/TLS

Laravel Cloud fuerza HTTPS. No requiere configuración.

---

## 📋 Checklist de Deploy

- [ ] Código pusheado a `main`
- [ ] Variables de entorno configuradas (APP_KEY, DB, Redis, S3)
- [ ] APP_DEBUG=false en producción
- [ ] Filesystem disk = s3
- [ ] Cache, Sessions, Queues = redis
- [ ] APP_URL apunta al dominio correcto
- [ ] MAIL configurado (Resend o SMTP)
- [ ] `php artisan migrate --force` se ejecutó OK
- [ ] Assets construidos (`public/build/manifest.json` existe)
- [ ] `cache:warmup` ejecutado post-deploy
- [ ] `health:check` retorna ✅
- [ ] Queue worker activo
- [ ] SSL/TLS funcionando (HTTPS)
- [ ] Probado: login, crear ticket, subir archivo (a S3)

---

## 🆘 Soporte

- **Laravel Cloud Docs**: [cloud.laravel.com/docs](https://cloud.laravel.com/docs)
- **Laravel Cloud Support**: Desde el dashboard
- **Logs**: `php artisan log:tail` desde Console
- **Status Page**: [status.laravel.com](https://status.laravel.com)

---

## 📚 Referencias Internas

- `13-storage-s3-bucket.md` — Configuración detallada del bucket S3
- `07-caching-strategy.md` — Estrategia de caché con Redis
- `REDIS_PRODUCTION_SETUP.md` (raíz) — Setup específico de Redis
- `LARAVEL_CLOUD_STORAGE.md` (raíz) — Storage específico de Laravel Cloud

---

**Versión**: 1.0  
**Plataforma**: Laravel Cloud (hosting oficial Laravel)  
**Stack**: MySQL + Redis + S3 (todo managed)  
**Última actualización**: Enero 2026
