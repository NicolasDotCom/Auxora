# Sistema de Tickets — Auxora

Aplicación de gestión de tickets de soporte técnico construida con **Laravel 12**, **Inertia.js** y **React 19**.

**Producción:** *pendiente de despliegue en VPS propio (Coolify)*

![Laravel 12](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![PHP 8.2+](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9%2B-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-blue)

---

## Tabla de contenidos

- [Stack](#stack)
- [Roles](#roles)
- [Requisitos previos](#requisitos-previos)
- [Inicio rápido](#inicio-rápido)
- [Scripts disponibles](#scripts-disponibles)
- [Comandos Artisan personalizados](#comandos-artisan-personalizados)
- [Variables de entorno](#variables-de-entorno)
- [Documentación interna](#documentación-interna)
- [Troubleshooting](#troubleshooting)
- [Credenciales por defecto](#credenciales-por-defecto)

---

## Stack

### Backend
- Laravel 12 sobre PHP 8.2+
- MySQL / MariaDB
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission) — sistema de roles y permisos

### Frontend
- React 19 + Inertia.js 3 + TypeScript
- Vite 6 como build tool
- Tailwind CSS 4

### Servicios externos
- **Resend** — entrega de emails transaccionales y verificación
- **AWS S3** — almacenamiento de archivos (alternativas: DigitalOcean Spaces, Cloudflare R2)
- **Redis** — cache, sesiones y colas (recomendado en producción)

### Extras
- **Laravel Excel (Maatwebsite)** — exportación a Excel
- **DomPDF** — exportación a PDF
- **Laravel Sanctum** — API REST de solo lectura

> ℹ️ Este proyecto usa **pnpm** como gestor de dependencias JavaScript. El repositorio ya incluye `pnpm-lock.yaml`; no usar `npm install` ni `yarn`.

---

## Roles

| Rol | Alcance |
|-----|---------|
| **Admin** | Acceso total al sistema |
| **Coordinador** | Supervisión, asignación de tickets y repuestos |
| **Support** | Solo los tickets asignados a él |
| **Comercial** | Crea tickets para clientes |
| **Customer** | Solo sus propios tickets |

Los roles se gestionan con permisos granulares (`view ticket`, `edit ticket`, `view customer`, etc.) y se administran desde el panel o con `php artisan role:list` / `role:create`. Consulta [ROLES.md](ROLES.md) para la guía completa.

---

## Requisitos previos

| Herramienta | Versión recomendada | Notas |
|-------------|----------------------|-------|
| PHP | 8.2+ | Extensiones: `intl`, `pdo_mysql`, `mbstring`, `gd`, `zip`, `openssl`, `bcmath` |
| Composer | 2.x | — |
| Node.js | 20 LTS o superior | Requerido por Vite 6 y Tailwind 4 |
| pnpm | 9+ | `npm install -g pnpm` |
| MySQL / MariaDB | 8 / 10.6+ | — |
| Laragon (Windows) | última | Incluye todo lo anterior salvo Node/pnpm |

---

## Inicio rápido

```bash
# 1. Clonar e instalar dependencias PHP
composer install

# 2. Instalar dependencias JavaScript con pnpm
pnpm install

# 3. Configurar entorno
cp .env.example .env
php artisan key:generate

# 4. Base de datos (asegúrate de tener MySQL corriendo y la DB creada)
php artisan migrate --seed

# 5. En dos terminales separadas, arrancar backend y frontend
php artisan serve          # http://localhost:8000
pnpm dev                   # http://localhost:5173 (Vite)
```

Para compilar los assets para producción:

```bash
pnpm build                 # build cliente
pnpm build:ssr             # build con SSR (opcional)
```

---

## Scripts disponibles

Definidos en `package.json` y ejecutables con `pnpm <script>`:

| Script | Función |
|--------|---------|
| `pnpm dev` | Servidor de desarrollo de Vite con HMR |
| `pnpm build` | Build de producción en `public/build` |
| `pnpm build:ssr` | Build con SSR para despliegues con Inertia SSR |
| `pnpm lint` | Ejecuta ESLint y aplica fixes |
| `pnpm format` | Aplica Prettier sobre `resources/` |
| `pnpm format:check` | Verifica formato sin escribir |
| `pnpm types` | Type-check con `tsc --noEmit` |

---

## Comandos Artisan personalizados

```bash
php artisan role:list                          # Ver roles y permisos
php artisan role:list --role=Coordinador       # Detalle de un rol
php artisan role:list --permissions            # Listar permisos disponibles
php artisan role:create "Supervisor"            # Crear rol
php artisan role:create "Rol" --permissions="view ticket" --permissions="edit ticket"

php artisan cache:warmup                       # Precachear datos críticos
php artisan health:check                       # Estado del sistema (Redis, DB, queues, mail)
php artisan sessions:cleanup                   # Limpiar sesiones expiradas
php artisan files:migrate-to-s3 --dry-run      # Simular migración a S3
php artisan files:migrate-to-s3                # Migrar archivos locales a S3
php artisan test:email-verification email@x.com # Probar envío de email
php artisan backup:documents                   # Backup de documentos
```

---

## Variables de entorno

Ejemplo mínimo para desarrollo local:

```env
APP_NAME=Tickets-App
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=auxora
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=resend
RESEND_KEY=re_xxx
MAIL_FROM_ADDRESS="auxora.support@gmail.com"
MAIL_FROM_NAME="Tickets-App"

FILESYSTEM_DISK=local   # 's3' en producción

SESSION_DRIVER=database
CACHE_STORE=database    # 'redis' en producción
QUEUE_CONNECTION=database
```

Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para la configuración completa de producción (HTTPS, cookies seguras, Redis, S3, optimizaciones de cache).

---

## Documentación interna

| Archivo | Contenido |
|---------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura, modelos, controladores, rutas |
| [ROLES.md](ROLES.md) | Sistema de roles y permisos dinámicos |
| [API.md](API.md) | API REST de solo lectura (tickets y comentarios) |
| [EMAIL.md](EMAIL.md) | Configuración de email (Resend, SMTP, verificación) |
| [STORAGE.md](STORAGE.md) | Almacenamiento de archivos (S3, local, migración) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy, Redis, optimización, autenticación en producción |

---

## Troubleshooting

### `pnpm install` falla en Laragon (Windows)

Asegúrate de tener habilitado **Corepack** y una versión reciente de Node:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

Si persiste, desactiva el ejecutador de scripts de PowerShell para esta sesión:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Error 419 (Page Expired) tras login

La sesión caduca por CSRF o por cookies no seguras en HTTPS. Verifica:

- `SESSION_DRIVER=database` y haber ejecutado `php artisan migrate`
- `SESSION_SECURE_COOKIE=true` en producción con HTTPS
- `APP_URL` con `https://`

Después: `php artisan config:clear && php artisan cache:clear`.

### Emails no llegan

1. Revisa `php artisan test:email-verification tu@correo.com`
2. En el `.env` de producción (gestionado por Coolify), confirma `MAIL_MAILER`, `RESEND_KEY` y `MAIL_FROM_ADDRESS`
3. Si usas `@gmail.com` sin dominio verificado en Resend, cámbialo a `onboarding@resend.dev` o verifica tu dominio

### `npm install` está en el README antiguo

**No usar `npm`**: el lockfile es `pnpm-lock.yaml`. Mezclar gestores generará `package-lock.json` no versionado y romperá builds en CI.

### Cambios en vistas Blade no se reflejan

```bash
php artisan view:clear
```

Si usas `php artisan view:cache` en producción, recuerda recompilar tras cambios.

---

## Credenciales por defecto

Generadas por el seeder:

- **Email:** `admin@tickets.com`
- **Password:** `password`

⚠️ Cambia la contraseña en el primer acceso. El seeder también crea usuarios de ejemplo para los demás roles; revisa `database/seeders/`.

---

## Licencia

Proyecto propietario. Todos los derechos reservados.