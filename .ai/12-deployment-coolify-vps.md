# 🚀 12 — Despliegue en Coolify / VPS propio

> **Coolify** es un panel self-hosted (open-source) que orquesta contenedores Docker sobre tu propio VPS. Es la alternativa autosuficiente a Laravel Cloud: tú controlas el servidor, la red y los datos.

---

## 🏗️ Stack del VPS

| Servicio | Tecnología | Cómo se levanta |
|----------|------------|------------------|
| **Hosting** | VPS propio + Coolify (Traefik) | Docker Compose generado por Coolify |
| **Base de datos** | MySQL 8 | Recurso `Database` en Coolify |
| **Cache** | Redis 7 (opcional) | Recurso `Redis` en Coolify |
| **Sessions** | Redis o database | Variable `SESSION_DRIVER` |
| **Queues** | Redis o database | Variable `QUEUE_CONNECTION` |
| **Storage** | MinIO o S3 externo | Ver `13-storage-s3-coolify.md` |
| **SSL/TLS** | Let's Encrypt automático | Coolify + Traefik |
| **Mail** | Configurable | Resend / SMTP según `.env` |

---

## 🔄 Flujo de Deploy

```
Push a main → Git
      ↓
Coolify detecta push (webhook)
      ↓
Build & install (en el VPS):
  • corepack enable
  • pnpm install --frozen-lockfile
  • pnpm run build
  • composer install --no-dev --optimize-autoloader
      ↓
Contenedor nuevo (Docker)
      ↓
Post-deploy hooks:
  • php artisan migrate --force
  • php artisan config:cache
  • php artisan route:cache
  • php artisan view:cache
      ↓
Traefik hace swap (zero-downtime)
      ↓
Production: App ↔ MySQL · Redis · MinIO
```

> El deployment tarda entre **1 y 3 minutos**. Si falla, Coolify mantiene la versión anterior viva (sin rollback automático, debes redeploy manual).

---

## ⚙️ Variables de Entorno en Coolify

Configurar en el panel **Coolify → Service → Environment Variables**.

### 🔴 Críticas (obligatorias)

```env
# === APP ===
APP_NAME="Sistema de Tickets"
APP_ENV=production
APP_KEY=base64:...                    # Generar con php artisan key:generate --show en local
APP_DEBUG=false
APP_URL=https://auxora.homelabvps.dev

# === DATABASE (Coolify expone el servicio como <nombre>_HOST) ===
DB_CONNECTION=mysql
DB_HOST=mysql                         # nombre del servicio en Coolify
DB_PORT=3306
DB_DATABASE=tickets
DB_USERNAME=tu_user
DB_PASSWORD=tu_password

# === CACHE / SESSIONS / QUEUES (Redis opcional pero recomendado) ===
CACHE_STORE=redis
SESSION_DRIVER=redis
SESSION_CONNECTION=cache
QUEUE_CONNECTION=redis
CACHE_PREFIX=auxora_

REDIS_HOST=redis                      # nombre del servicio en Coolify
REDIS_PORT=6379
REDIS_PASSWORD=<provisto por Coolify>

# === STORAGE ===
FILESYSTEM_DISK=local                 # o 's3' si configuras MinIO / S3 externo
# AWS_ACCESS_KEY_ID=<si usas MinIO>
# AWS_SECRET_ACCESS_KEY=<si usas MinIO>
# AWS_DEFAULT_REGION=us-east-1
# AWS_BUCKET=tickets
# AWS_ENDPOINT=http://minio:9000
# AWS_URL=https://auxora.homelabvps.dev

# === MAIL ===
MAIL_MAILER=resend
RESEND_KEY=re_xxx

# === CONNECTION POOLING ===
DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=100
```

### 🟡 Opcionales

```env
# Logs
LOG_CHANNEL=stack
LOG_LEVEL=error

# Mail From
MAIL_FROM_ADDRESS="noreply@homelabvps.dev"
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum (API)
SANCTUM_STATEFUL_DOMAINS=auxora.homelabvps.dev
```

---

## 📦 Connection pooling MySQL

Mantener la configuración de `config/database.php` con `min_connections` / `max_connections`:

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
    'pool' => [
        'min_connections' => env('DB_MIN_CONNECTIONS', 5),
        'max_connections' => env('DB_MAX_CONNECTIONS', 100),
    ],
],
```

> Evita que MySQL colapse bajo carga concurrente (50+ usuarios).

---

## 🚀 Pasos para el Primer Deploy

### 1. Preparar el VPS

- VPS Ubuntu 22.04 o Debian 12 con 2 vCPU / 4 GB RAM mínimo.
- Dominio apuntando con `A` a la IP del VPS.
- Instalar Coolify siguiendo la [documentación oficial](https://coolify.io/docs/installation).

### 2. Crear los recursos en Coolify

1. **Project → + New → Resource**
2. Crear un servicio `MySQL 8` (recursos → database).
3. (Opcional) Crear un servicio `Redis 7`.
4. (Opcional) Crear un servicio `MinIO` para S3 self-hosted.
5. Coolify expone `MYSQL_HOST=tu-servicio-mysql`, `REDIS_HOST=tu-servicio-redis`, etc. y los inyecta automáticamente si los agregas como service links.

### 3. Crear la aplicación

1. **Projects → + Add → Application → Public/Private Repository**.
2. Conectar el repositorio Git.
3. **Build Pack**: `Dockerfile`.
4. **Dockerfile Location**: `/Dockerfile`.
5. **Port**: `8080`.
6. **Domains**: `auxora.homelabvps.dev` (Coolify emite certificado Let's Encrypt).
7. Activa **Force HTTPS**.

### 4. Configurar variables

Copia las variables listadas arriba en **Environment Variables**. Coolify las inyecta como `KEY=VALUE` dentro del contenedor.

### 5. Deploy inicial

```bash
# En local
php artisan key:generate --show     # pegar en APP_KEY

git push origin main
```

Coolify ejecutará el build y los hooks automáticamente.

---

## 🔄 Deploy Continuo

Después de cada `git push`:

1. Coolify detecta el push vía webhook.
2. Reconstruye la imagen con la nueva `pnpm run build` y `composer install`.
3. Corre los **post-deploy hooks** (`migrate --force`, cache, etc.).
4. Traefik hace swap al nuevo contenedor (zero-downtime).

Configurar webhook en GitHub si es repo privado: **Settings → Webhooks → Add webhook** con la URL que Coolify muestra en la sección *GitHub App / Deploy Key*.

---

## 🧰 Comandos Post-Deploy

Ejecutar dentro del contenedor (Coolify → *Terminal*):

```bash
# 1. Pre-cargar catálogos críticos
php artisan cache:warmup

# 2. Verificar salud del sistema
php artisan health:check

# 3. Si vienes de sesiones en database, limpiarlas
php artisan sessions:cleanup

# 4. Iniciar queue worker (Coolify puede configurarlo como servicio adicional)
php artisan queue:work --queue=default --sleep=3 --tries=3 --max-jobs=1000
```

Salida esperada de `health:check`:

```
🏥 Verificando salud del sistema...

🔴 Redis
   ✅ Conexión OK - redis
   📊 Keys en caché: 1245

🔴 Base de Datos MySQL
   ✅ Conexión OK - mysql
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

## 📊 Métricas de Performance

| Métrica | Database | Redis (Coolify + VPS) |
|---------|----------|-----------------------|
| Response time | 1200 ms | 200-300 ms |
| Queries/request | 8-12 | 3-5 |
| Memory/request | 40 MB | 15 MB |
| Concurrent sessions | ~10-15 | 100+ |
| Cache hit rate | 20% | 80%+ |

---

## 🔍 Monitoreo

### Redis

```bash
php artisan tinker
> Redis::ping()
"PONG"

> Cache::getRedis()->dbsize()
```

### Logs

```bash
# Desde Coolify → Logs (en tiempo real)
# O dentro del contenedor
docker logs -f <contenedor-app>

tail -f storage/logs/laravel.log
```

### Queue jobs

```bash
php artisan queue:failed
php artisan queue:retry all
```

---

## ⚠️ Troubleshooting

### 🔴 Redis no disponible

```bash
php artisan tinker
> Redis::ping()
> Cache::getStore()
```

Verifica `REDIS_HOST` y `REDIS_PASSWORD` en Coolify → Environment Variables.

### 🔴 Migración falla en deploy

```bash
php artisan migrate --force --pretend
php artisan migrate:rollback --step=1
```

### 🔴 Assets no se cargan (CSS/JS)

```bash
pnpm install --frozen-lockfile && pnpm run build
ls public/build/manifest.json
```

### 🔴 Archivos subidos desaparecen tras redeploy

Causa: estás usando `FILESYSTEM_DISK=local` en lugar de un volumen persistente o S3/MinIO. Ver `13-storage-s3-coolify.md`.

### 🔴 Queue jobs no se procesan

Crear un servicio adicional en Coolify que ejecute `php artisan queue:work` como proceso supervisado (con `supervisord` o el propio `healthcheck` de Docker).

### 🔴 Session expirada constantemente

```bash
php artisan tinker
> config('session.driver')          # debe ser "redis"
> Redis::connection('cache')->ping()
"PONG"
```

---

## 🛡️ Seguridad

- ✅ **Nunca** commitear `.env` al repo.
- ✅ Coolify cifra las env vars en reposo.
- ✅ Rotar `APP_KEY` si se sospecha comprometida.
- ✅ Activar **Force HTTPS** en el dominio de Coolify.
- ✅ Cerrar el puerto 8000 del panel de Coolify (usar un VPN o un proxy con autenticación).

### Rate Limiting

Ya configurado en `app/Providers/AppServiceProvider.php`:

```php
RateLimiter::for('api', fn (Request $r) =>
    Limit::perMinute(90)->by($r->user()?->id ?: $r->ip())
);
RateLimiter::for('login', fn (Request $r) =>
    Limit::perMinute(5)->by($r->ip())
);
```

---

## 📋 Checklist de Deploy

- [ ] VPS preparado y Coolify instalado
- [ ] Recursos Coolify: MySQL, Redis, MinIO (si aplica)
- [ ] Aplicación conectada al repo Git
- [ ] Variables de entorno configuradas
- [ ] Dominio apuntando al VPS con TLS válido
- [ ] `APP_DEBUG=false` y `APP_URL` correcto
- [ ] `FILESYSTEM_DISK` apunta a disco persistente (s3/MinIO)
- [ ] Cache, Sessions, Queues = redis (recomendado)
- [ ] `php artisan migrate --force` ejecutado
- [ ] Assets construidos (`public/build/manifest.json` existe)
- [ ] `cache:warmup` y `health:check` OK
- [ ] Queue worker corriendo
- [ ] Probado: login, crear ticket, subir archivo

---

## 📚 Referencias Internas

- `13-storage-s3-coolify.md` — Configuración detallada de MinIO / S3 en Coolify
- `07-caching-strategy.md` — Estrategia de caché con Redis
- `../DEPLOYMENT.md` — Guía operativa principal de despliegue

---

**Versión**: 2.0  
**Plataforma**: Coolify sobre VPS propio  
**Stack**: MySQL + Redis + MinIO/S3  
**Última actualización**: Enero 2026