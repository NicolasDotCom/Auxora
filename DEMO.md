# Modo Demo (Portafolio / Sandbox)

Auxora puede exponerse públicamente como una demo viva desde la que cualquier visitante puede:

1. **Entrar con 1-click** como uno de los 4 roles predefinidos (admin / coordinador / soporte / cliente).
2. **Registrarse libremente** con email + contraseña (limitado, con anti-bot y throttle).
3. Ver datos realistas (10 tickets, 5 clientes, 3 técnicos, comentarios, historial).
4. Ser reseteado automáticamente cada noche para evitar acumulación de basura.

> Diseñado para mostrar Auxora en tu portafolio sin riesgo de abuso ni coste extra.

---

## 1. Activar el modo demo

### Variables de entorno

```env
APP_DEMO=true
APP_DEMO_BANNER="Entorno demo — los datos se reinician cada noche a las 03:00 UTC"
APP_DEMO_PUBLIC_REGISTRATION=true
APP_DEMO_MAX_TICKETS_PER_USER=5
APP_DEMO_RESET_HOUR=3
APP_NAME="Auxora — Demo"
```

| Variable | Default | Significado |
|----------|---------|-------------|
| `APP_DEMO` | `false` | Activa el modo demo. `false` = comportamiento normal (producción) |
| `APP_DEMO_BANNER` | "Entorno demo..." | Texto del banner persistente visible en toda la app |
| `APP_DEMO_PUBLIC_REGISTRATION` | `true` | Habilita `/register` con throttle + honeypot |
| `APP_DEMO_MAX_TICKETS_PER_USER` | `5` | Límite de tickets para usuarios con rol `customer` |
| `APP_DEMO_RESET_HOUR` | `3` | Hora UTC del cron de reset diario |

### Activación paso a paso

1. **Editar `.env` en el VPS** (o desde el panel de Coolify → Environment Variables).
2. **Ejecutar el seeder** (idempotente, no duplica datos):
   ```bash
   php artisan db:seed --class=DemoDataSeeder --force
   ```
3. **Limpiar caché**:
   ```bash
   php artisan config:clear && php artisan cache:clear && php artisan route:clear
   ```
4. **Configurar el cron** para que el reset corra cada noche:
   ```bash
   # En Coolify → Scheduled Tasks, o en crontab del VPS:
   * * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
   ```
   El scheduler internamente dispara `demo:reset` a la hora configurada.

---

## 2. URLs públicas

| URL | Acceso | Descripción |
|-----|--------|-------------|
| `/welcome` | Público | Landing con 4 botones 1-click + opción de registrarse |
| `/demo/login/{role}` | Público (demo) | Login sin password. Solo roles: `admin`, `Coordinador`, `support`, `customer` |
| `/register` | Público (demo) | Alta de usuarios nuevos (3/hora por IP, honeypot anti-spam) |
| `/login` | Público | Login clásico con password (respaldo) |
| `/api/v1/*` | Token | API REST de solo lectura (no se pueden crear tokens en demo) |

> Si `APP_DEMO=false`, las rutas `/welcome` y `/demo/login/*` devuelven **404** automáticamente (middleware `demo`).

---

## 3. Usuarios demo (semillas)

El seeder crea/actualiza estos 4 usuarios:

| Rol | Email | Password (backup) |
|-----|-------|-------------------|
| `admin` | `demo-admin@auxora.demo` | `demo1234` |
| `Coordinador` | `demo-coordinador@auxora.demo` | `demo1234` |
| `support` | `demo-support@auxora.demo` | `demo1234` |
| `customer` | `demo-customer@auxora.demo` | `demo1234` |

> ⚠️ Las passwords no se usan en el 1-click login (que autentica sin password). Son solo respaldo si quieres probar el flujo `/login` clásico.

---

## 4. Reset diario (cron)

El comando `demo:reset` corre automáticamente cada noche (configurable con `APP_DEMO_RESET_HOUR`).

**Qué hace:**
1. `migrate:fresh --seed` → borra todos los tickets, comentarios, adjuntos, clientes, técnicos.
2. Ejecuta `DemoDataSeeder` → recrea los 4 usuarios demo + 5 clientes + 3 técnicos + 10 tickets realistas + comentarios + historial.
3. Ejecuta `cache:clear` y `optimize:clear`.

**Lo que NO toca:**
- Los usuarios del sistema (admin real, etc.) — el seeder los crea con `updateOrCreate`, no los duplica.
- Roles y permisos (gestionados por `RolesAndPermissionsSeeder`).

**Para ejecutarlo manualmente:**
```bash
php artisan demo:reset --force
```

**Comando adicional para limpiar adjuntos en S3/MinIO** (corre 15 min después del reset, configurado en `routes/console.php`):
```bash
php artisan demo:clean-storage
# o especificar disco:
php artisan demo:clean-storage --disk=s3
```

---

## 5. Seguridad aplicada

| Riesgo | Mitigación |
|--------|------------|
| Spam de registros | Throttle `3 por IP / hora` + honeypot `website` (campo oculto anti-bot) |
| Acumulación de basura | Reset diario + limpieza de adjuntos |
| Abuso de adjuntos | Límite de 5 tickets por usuario customer |
| Bots en landing | Rate limit heredado + middleware `EnsureDemoModeEnabled` (404 fuera de demo) |
| API abuse | Sanctum token creation deshabilitado en demo (403) |
| Email bombing | Los nuevos usuarios NO disparan email de verificación en demo si `MAIL_MAILER=log` |
| Cookies robadas | `SESSION_SECURE_COOKIE=true` + `SESSION_LIFETIME=120` para sesiones demo |
| CSRF | Cubierto por Laravel Sanctum |
| Archivos maliciosos | Límite de mime types en `TicketController::store` (`pdf, doc, docx, txt, jpg, jpeg, png, xlsx, xls`) |

---

## 6. Costes adicionales

| Servicio | Coste |
|----------|-------|
| Email (Resend free tier) | $0 — 100 emails/día, 3000/mes (suficiente para registros típicos) |
| Storage S3/MinIO | $0 incluido en el VPS |
| Cron scheduler | $0 incluido en Coolify |
| **Total** | **$0** |

Si te haces viral y excedes 100 registros/día, Resend puede cortar el envío. Soluciones:
1. Verificar tu propio dominio en Resend (gratis) para subir el límite.
2. Poner `MAIL_MAILER=log` en demo (los emails se guardan en `storage/logs/laravel.log` en vez de enviarse).

---

## 7. Desactivar el modo demo

Para volver al modo producción:

```env
APP_DEMO=false
```

**Limpieza recomendada:**
```bash
php artisan config:clear && php artisan cache:clear && php artisan route:clear
php artisan schedule:clear
# (opcional) Borrar usuarios demo:
php artisan tinker
> User::where('email', 'like', '%@auxora.demo')->delete()
```

---

## 8. Estructura de archivos creados/modificados

```
app/
├── Helpers/
│   └── DemoHelper.php                  # Helper centralizado
├── Http/
│   ├── Controllers/
│   │   ├── Auth/RegisteredUserController.php  # + honeypot + role customer
│   │   ├── ApiTokenManagerController.php       # + bloqueo en demo
│   │   ├── DemoController.php           # ✨ nuevo: welcome + 1-click login
│   │   └── TicketController.php         # + límite tickets demo
│   └── Middleware/
│       └── EnsureDemoModeEnabled.php    # ✨ nuevo: 404 fuera de demo
└── Console/Commands/
    ├── DemoReset.php                    # ✨ nuevo: migrate:fresh + seed
    └── DemoCleanStorage.php             # ✨ nuevo: limpia S3/MinIO

database/seeders/
├── DemoDataSeeder.php                   # ✨ nuevo: 4 users + tickets
└── DatabaseSeeder.php                   # modificado: delega a DemoDataSeeder

resources/js/pages/
├── Welcome.tsx                          # ✨ nuevo: landing con 4 botones
├── auth/register.tsx                    # + honeypot + aviso demo
└── layouts/app/app-sidebar-layout.tsx   # + banner persistente

routes/
├── web.php                              # + rutas demo
└── console.php                          # + schedule demo:reset

config/
└── app.php                              # + bloque 'demo'

bootstrap/
└── app.php                              # + alias 'demo' middleware
```

---

## 9. Checklist de despliegue en VPS

- [ ] `APP_DEMO=true` en `.env`
- [ ] `APP_NAME="Auxora — Demo"`
- [ ] Ejecutar `php artisan db:seed --class=DemoDataSeeder --force`
- [ ] Limpiar caché (`config:clear`, `route:clear`, `cache:clear`)
- [ ] Verificar que `/welcome` muestra los 4 botones
- [ ] Probar 1-click login con cada rol
- [ ] Probar registro público (`/register`)
- [ ] Configurar cron `* * * * * php artisan schedule:run`
- [ ] Verificar primera ejecución de `demo:reset` (puede tardar 5-30s)
- [ ] Confirmar que `demo:clean-storage` corre tras el reset

---

**Versión:** 1.0  
**Última actualización:** Enero 2026  
**Aplica a:** Laravel 13 + React 19 + Inertia 3