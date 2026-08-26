# Contexto del Agente IA — Sistema de Tickets

> Carpeta `.ai/` con documentación para asistir a IAs (Copilot, Cursor, Windsurf, Claude, GPT) en el desarrollo del proyecto.

## Perfil del agente

- **Experto Laravel 12** (PHP 8.2+, Eloquent, SOLID, Service Layer)
- **Senior Full Stack** (React 19, TypeScript 5.7, Inertia.js v2)
- **Arquitecto** (decisiones escalables, mantenibles, documentadas)
- **Defensor de buenas prácticas** (validación en FormRequests, middleware de permisos, eager loading, CacheService)

## Reglas de Oro (inquebrantables)

1. Toda ruta nueva lleva middleware de permiso.
2. Toda validación va en `FormRequest`, nunca en el controlador.
3. Toda query usa `with()` (eager loading) + `select()` (no `SELECT *`).
4. Toda caché va por `CacheService` (nunca `Cache::remember` directo).
5. Toda mutación invalida la caché correspondiente.
6. Toda subida de archivo usa `config('filesystems.default')` (S3 en prod).
7. Toda descarga usa `Storage::disk(config('filesystems.default'))`.
8. Controllers delgados: si >30 líneas, extraer a Service.
9. TypeScript estricto: nunca `any` sin justificación.
10. Roles siempre vía Spatie en BD (nunca hardcoded en código).

## Índice de documentos

| # | Archivo | Cuándo leerlo |
|---|---------|---------------|
| 01 | [01-project-overview.md](01-project-overview.md) | Para entender dominio y casos de uso |
| 02 | [02-architecture.md](02-architecture.md) | Decisiones arquitectónicas y capas |
| 03 | [03-models-and-relationships.md](03-models-and-relationships.md) | Modelo nuevo o relación |
| 04 | [04-roles-and-permissions.md](04-roles-and-permissions.md) | Permiso o rol nuevo |
| 05 | [05-coding-standards.md](05-coding-standards.md) | Estilo PHP/Laravel/React |
| 06 | [06-frontend-react-inertia.md](06-frontend-react-inertia.md) | Página o componente nuevo |
| 07 | [07-caching-strategy.md](07-caching-strategy.md) | Lógica de caché nueva |
| 08 | [08-routes-and-controllers.md](08-routes-and-controllers.md) | Ruta o controlador nuevo |
| 09 | [09-testing.md](09-testing.md) | Test nuevo |
| 10 | [10-common-patterns.md](10-common-patterns.md) | Implementar feature estándar |
| 11 | [11-dos-and-donts.md](11-dos-and-donts.md) | Duda rápida sobre ✅ o ❌ |
| 12 | [12-deployment-laravel-cloud.md](12-deployment-laravel-cloud.md) | Deploy a Laravel Cloud |
| 13 | [13-storage-s3-bucket.md](13-storage-s3-bucket.md) | Storage S3 / archivos |

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 12, PHP 8.2+, MySQL |
| Frontend | React 19, TypeScript 5.7, Inertia.js v2, Vite 6, Tailwind 4 |
| Auth | Laravel Sanctum (API) + Spatie Permission (RBAC) |
| DB / Hosting | MySQL + Laravel Cloud (auto-deploy desde Git) |
| Cache / Sessions / Queues | Redis (managed por Laravel Cloud) |
| Storage | Bucket S3 (managed por Laravel Cloud, persistente) |
| Mail | Resend / SMTP |
| Tests | Pest 3 + PHPUnit 11 |
| Extras | Maatwebsite Excel, DomPDF, Radix UI, TanStack Table, Recharts |

## Comandos Artisan personalizados

```bash
php artisan role:list                          # Ver todos los roles
php artisan role:list --role=Coordinador       # Ver un rol
php artisan role:list --permissions            # Ver permisos disponibles
php artisan role:create "Mi Rol" --permissions="view ticket"

php artisan cache:warmup                       # Pre-cargar catálogos (post-deploy)
php artisan health:check                       # Verificar Redis + MySQL + Queue
php artisan sessions:cleanup                   # Limpiar sesiones expiradas
php artisan files:migrate-to-s3 --dry-run      # Simular migración local→S3
php artisan files:migrate-to-s3                # Migrar archivos locales a S3
php artisan test:email-verification email@x.com # Probar envío de email
php artisan backup:documents                   # Backup de documentos
```

## Antes de generar código

1. Lee el archivo del tema relevante (ver tabla arriba).
2. Si la tarea toca varias áreas, lee varios.
3. Ante la duda sobre ✅/❌, consulta `11-dos-and-donts.md`.
4. Para implementar feature estándar, `10-common-patterns.md` tiene plantillas copia-pega.

## Antes de commit

- [ ] Validación en `FormRequest`
- [ ] Middleware de permisos aplicado
- [ ] Eager loading + select específico en queries
- [ ] Paginación si es listado
- [ ] `CacheService::clearXxxCache()` si muté datos
- [ ] Storage usa `config('filesystems.default')`
- [ ] TypeScript sin `any`
- [ ] Tests añadidos/actualizados
- [ ] Lint y tipos pasan (`npm run lint && npm run types`)
- [ ] Mensaje de commit en conventional format

## Antes de deploy a Laravel Cloud

- [ ] `FILESYSTEM_DISK=s3` en producción
- [ ] `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`
- [ ] `APP_DEBUG=false`, `APP_URL` apunta al dominio correcto
- [ ] `npm run build` ejecutado y commiteado

Post-deploy: `php artisan migrate --force`, `cache:warmup`, `health:check`.

---

**Versión**: 2.0 (consolidado)
**Última actualización**: Enero 2026
