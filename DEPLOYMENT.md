# Despliegue, Optimización y Autenticación

> **Estado:** el proyecto aún **no está desplegado**. La infraestructura destino es un **VPS propio orquestado con [Coolify](https://coolify.io/)** (Traefik + Docker). Esta guía cubre la configuración completa que aplicarás cuando despliegues.

URL de producción:

```env
APP_URL=https://auxora.homelabvps.dev
```

---

## 1. Despliegue en Coolify (VPS propio)

### 1.1 Requisitos del servidor

- VPS con 2 vCPU / 4 GB RAM mínimo (recomendado 4 vCPU / 8 GB para producción real).
- Docker 24+ y Docker Compose v2 instalados (Coolify los gestiona).
- Dominio con DNS apuntando a la IP del VPS (registro `A` o `CNAME`).
- Puertos 80 y 443 abiertos.

### 1.2 Crear el servicio en Cloud

1. Entra al panel de Coolify (por defecto `http://IP_DEL_VPS:8000`).
2. **Projects → + Add → Application → Public/Private Repository** apuntando al repo Git.
3. **Build Pack**: `Dockerfile`.
4. **Dockerfile Location**: `/Dockerfile` (raíz del repo).
5. **Port**: `8080` (es el que expone nuestro Nginx).
6. **Domains**: añade `auxora.homelabvps.dev` y deja que Coolify emita el certificado TLS automático con Let's Encrypt.
7. Activa **Force HTTPS**.

### 1.3 Recursos adicionales

Crea desde el panel de Coolify:

| Recurso | Imagen / tipo | Uso |
|---------|---------------|-----|
| MySQL 8 | `mysql:8.0` | Base de datos |
| Redis 7 | `redis:7-alpine` | Cache, sesiones y colas (opcional, recomendado) |
| MinIO (opcional) | `minio/minio` | Alternativa S3 self-hosted |

Coolify los levantará en la misma red Docker y expondrá las credenciales en **Environment Variables**.

### 1.4 Variables de entorno

```env
APP_NAME=Tickets-App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://auxora.homelabvps.dev
APP_LOCALE=es
APP_FALLBACK_LOCALE=es

# Sesiones (CRÍTICO en HTTPS)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=null

# Email (ver EMAIL.md)
MAIL_MAILER=resend
RESEND_KEY=re_xxx
MAIL_FROM_ADDRESS=auxora.support@gmail.com
MAIL_FROM_NAME=Tickets-App

# Storage (ver STORAGE.md)
FILESYSTEM_DISK=local          # o 's3' con credenciales propias

# Cola
QUEUE_CONNECTION=sync

# Log
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### 1.5 Despliegue

1. Push al repositorio conectado.
2. Coolify detecta el push y reconstruye la imagen.
3. Ejecutar las migraciones (primer despliegue):

   ```bash
   # Desde el panel de Coolify → Terminal del contenedor
   php artisan migrate --force
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

4. Activar el **one-off job** o `post-deploy command` con:

   ```bash
   php artisan migrate --force --no-interaction && \
   php artisan config:cache && \
   php artisan route:cache && \
   php artisan view:cache
   ```

### 1.6 Reverse proxy y TLS

Coolify usa **Traefik** como reverse proxy. La configuración automática:

- Redirección HTTP → HTTPS automática.
- Certificados Let's Encrypt renovables.
- Headers de seguridad (`X-Forwarded-Proto`, `X-Forwarded-For`) ya propagados a Laravel.

Si necesitas configurar manualmente Traefik, la ruta del servicio queda en `/etc/traefik/dynamic_conf` del VPS.

---

## 2. Optimización con Redis (recomendado)

Sustituye `database` por Redis para sesiones, cache y colas:

```env
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis

DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=100

Coolify permite desplegar Redis como servicio auxiliar (`Add → Resource → Redis 7`) y exponer `REDIS_HOST=redis`, `REDIS_PASSWORD`, `REDIS_PORT=6379` automáticamente.

### 2.1 Mejoras esperadas

| Métrica | Database | Redis |
|---------|----------|-------|
| Sesiones concurrentes | ~10 | 100+ |
| Response time | 1200 ms | 200 ms |
| Queries/request | 8-12 | 3-5 |
| Cache hit rate | 20% | 80%+ |

### 2.2 Verificar

```bash
php artisan tinker
>>> Redis::ping()
=> "PONG"

php artisan health:check
```

---

## 3. Cache y rendimiento

### 3.1 CacheService

`app/Services/CacheService.php` centraliza el caché con TTL diferenciado:

- **1 hora:** listas de clientes, técnicos, empresas
- **24 horas:** festivos
- **5 minutos:** estadísticas del dashboard

Invalidación automática al crear/actualizar/eliminar entidades.

### 3.2 Índices de BD

49 índices estratégicos en todas las tablas. Ver `database/migrations/2026_01_23_000001_add_indexes_for_optimization.php`.

```bash
php artisan migrate
```

Verificar:

```sql
SHOW INDEX FROM tickets;
SHOW INDEX FROM customers;
```

### 3.3 Comandos útiles

```bash
php artisan cache:warmup        # Precachear datos críticos
php artisan health:check        # Estado del sistema (Redis, DB, sessions, queue)
php artisan sessions:cleanup    # Limpiar sesiones expiradas
php artisan optimize:clear      # Limpiar toda la caché
php artisan config:cache        # Cachear configuración (producción)
php artisan route:cache         # Cachear rutas (producción)
php artisan view:cache          # Cachear vistas (producción)
```

---

## 4. Autenticación en producción (HTTPS)

**Problema:** las cookies no se mantienen en HTTPS sin el flag `Secure`.

**Solución crítica** — agregar en `.env` de producción:

```env
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
APP_URL=https://auxora.homelabvps.dev
```

Sin estas variables la sesión expira tras cada request y el login falla silenciosamente.

### 4.1 Verificar en navegador

DevTools (F12) → Application → Cookies → la cookie `xxx_session` debe tener:

- `Secure`: Yes
- `HttpOnly`: Yes
- `SameSite`: Lax
- `Domain`: auxora.homelabvps.dev

### 4.2 Errores comunes

**419 Page Expired (CSRF):**

- `SESSION_DRIVER=database`
- Verificar que la tabla `sessions` existe: `php artisan migrate`
- `php artisan config:clear`

**Logout tras cada request:**

- `SESSION_SECURE_COOKIE=true` falta
- Verificar que `APP_URL` empieza por `https://`

---

## 5. Monitoreo

```bash
# Health check completo
php artisan health:check

# Sesiones activas
php artisan tinker
>>> DB::table('sessions')->count()

# Queue jobs fallidos
php artisan queue:failed

# Logs del contenedor
docker logs -f <nombre-contenedor-app>
```

Alternativas de observabilidad compatibles con Coolify:

- **Glances** o **Uptime Kuma** (services oficiales de Coolify) para métricas del VPS.
- **Laravel Telescope / Pulse** en entorno `local`/`staging` (nunca en producción pública).
- **Sentry** o **Axiom** para tracking de errores centralizado.

---

## 6. Rollback

Coolify guarda imágenes por cada deploy. Para volver a la versión anterior:

1. **Coolify → Deployments** → selecciona la versión estable → **Redeploy**.
2. Coolify recrea el contenedor con la imagen previa (~30 segundos).

O por CLI:

```bash
git revert HEAD
git push origin main
```

Coolify redeployará con el commit anterior.

---

## 7. Post-deploy checklist

- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan health:check` retorna estado OK
- [ ] Login funciona y mantiene sesión
- [ ] Crear usuario de prueba y verificar email
- [ ] Subir y descargar un documento
- [ ] Verificar Redis activo (si aplica)
- [ ] Confirmar HTTPS forzado y certificado válido
- [ ] Revisar logs en `storage/logs/laravel.log`