# Despliegue, Optimización y Autenticación

## Despliegue en Laravel Cloud

### Variables de entorno requeridas

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tickets-app-main-dbvpcm.laravel.cloud
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
FILESYSTEM_DISK=s3

# Cola
QUEUE_CONNECTION=sync

# Log
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### Pasos

1. Push del código al repositorio.
2. Laravel Cloud detecta y deploya automáticamente.
3. Verificar que las variables están en **Settings → Environment Variables**.
4. Ejecutar post-deploy:
   ```bash
   php artisan migrate --force
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

## Optimización con Redis (recomendado en producción)

Sustituye database por Redis para sessions, cache y queues:

```env
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis

DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=100
```

Laravel Cloud incluye Redis como add-on. Activarlo desde **Settings → Add-ons**.

### Mejoras esperadas

| Métrica | Database | Redis |
|---------|----------|-------|
| Sesiones concurrentes | ~10 | 100+ |
| Response time | 1200ms | 200ms |
| Queries/request | 8-12 | 3-5 |
| Cache hit rate | 20% | 80%+ |

### Verificar

```bash
php artisan tinker
>>> Redis::ping()
=> "PONG"

php artisan health:check
```

## Cache y rendimiento

### CacheService

`app/Services/CacheService.php` centraliza el caché con TTL diferenciado:

- **1 hora:** listas de clientes, técnicos, empresas
- **24 horas:** festivos
- **5 minutos:** estadísticas del dashboard

Invalidación automática al crear/actualizar/eliminar entidades.

### Índices de BD

49 índices estratégicos en todas las tablas. Ver `database/migrations/2026_01_23_000001_add_indexes_for_optimization.php`.

```bash
php artisan migrate
```

Verificar:

```sql
SHOW INDEX FROM tickets;
SHOW INDEX FROM customers;
```

### Comandos útiles

```bash
php artisan cache:warmup        # Precachear datos críticos
php artisan health:check        # Estado del sistema (Redis, DB, sessions, queue)
php artisan sessions:cleanup    # Limpiar sesiones expiradas
php artisan optimize:clear      # Limpiar toda la caché
php artisan config:cache        # Cachear configuración (producción)
php artisan route:cache         # Cachear rutas (producción)
php artisan view:cache          # Cachear vistas (producción)
```

## Autenticación en producción (HTTPS)

**Problema:** las cookies no se mantienen en HTTPS sin `Secure` flag.

**Solución crítica** — agregar en Laravel Cloud:

```env
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
APP_URL=https://tickets-app-main-dbvpcm.laravel.cloud
```

Sin estas variables la sesión expira tras cada request y el login falla silenciosamente.

### Verificar en navegador

DevTools (F12) → Application → Cookies → la cookie `xxx_session` debe tener:
- `Secure`: Yes
- `HttpOnly`: Yes
- `SameSite`: Lax
- `Domain`: tickets-app-main-dbvpcm.laravel.cloud

### Errores comunes

**419 Page Expired (CSRF):**
- `SESSION_DRIVER=database`
- Verificar tabla `sessions` existe: `php artisan migrate`
- `php artisan config:clear`

**Logout tras cada request:**
- `SESSION_SECURE_COOKIE=true` falta
- Verificar `APP_URL` con `https://`

## Monitoreo

```bash
# Health check completo
php artisan health:check

# Sesiones activas
php artisan tinker
>>> DB::table('sessions')->count()

# Queue jobs fallidos
php artisan queue:failed

# Logs en tiempo real (Laravel Cloud)
php artisan tail
```

## Rollback

Si algo falla tras un deploy:

```bash
git revert HEAD
git push origin main
```

Laravel Cloud redeploya la versión anterior en ~30 segundos.

## Post-deploy checklist

- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan health:check` retorna estado OK
- [ ] Login funciona y mantiene sesión
- [ ] Crear usuario de prueba y verificar email
- [ ] Subir y descargar un documento
- [ ] Verificar Redis activo (si aplica)
