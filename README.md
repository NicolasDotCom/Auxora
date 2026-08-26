# Sistema de Tickets

Aplicación de gestión de tickets de soporte técnico construida con **Laravel 12**, **Inertia.js** y **React 19**.

**Producción:** https://tickets-app-main-dbvpcm.laravel.cloud

## Stack

- **Backend:** Laravel 12, PHP 8.2+, MySQL/MariaDB
- **Frontend:** React 19, Inertia.js, TypeScript, Tailwind CSS, Vite
- **Auth/Roles:** Laravel Sanctum, Spatie Laravel Permission
- **Servicios:** Resend (emails), S3 (archivos), Redis (cache/sessions/queues)
- **Extras:** Maatwebsite/Excel, DomPDF

## Roles

- **Admin** — Acceso total
- **Coordinador** — Supervisión y asignación
- **Support** — Solo tickets asignados
- **Comercial** — Crea tickets para clientes
- **Customer** — Solo sus tickets

## Inicio rápido

```bash
# Instalar dependencias
composer install
npm install
cp .env.example .env
php artisan key:generate

# Base de datos
php artisan migrate --seed

# Compilar frontend
npm run build

# Servidor de desarrollo
php artisan serve
npm run dev
```

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura, modelos, controladores, rutas |
| [ROLES.md](ROLES.md) | Sistema de roles y permisos dinámicos |
| [API.md](API.md) | API REST de solo lectura (tickets y comentarios) |
| [EMAIL.md](EMAIL.md) | Configuración de email (Resend, SMTP, verificación) |
| [STORAGE.md](STORAGE.md) | Almacenamiento de archivos (S3, local, migración) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy, Redis, optimización, autenticación en producción |

## Credenciales por defecto (después del seeder)

- **Email:** `admin@tickets.com`
- **Password:** `password`

## Comandos Artisan personalizados

```bash
php artisan role:list                          # Ver roles y permisos
php artisan role:create "Supervisor"            # Crear rol
php artisan role:create "Rol" --permissions="view ticket" --permissions="edit ticket"

php artisan cache:warmup                       # Precachear datos críticos
php artisan health:check                       # Estado del sistema
php artisan sessions:cleanup                   # Limpiar sesiones expiradas
php artisan files:migrate-to-s3 --dry-run      # Simular migración a S3
php artisan files:migrate-to-s3                # Migrar archivos locales a S3
php artisan test:email-verification email@x.com # Probar envío de email
php artisan backup:documents                   # Backup de documentos
```

## Variables de entorno principales

```env
APP_NAME=Tickets-App
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql

MAIL_MAILER=resend
RESEND_KEY=re_xxx
MAIL_FROM_ADDRESS="auxora.support@gmail.com"

FILESYSTEM_DISK=local   # 's3' en producción

SESSION_DRIVER=database
CACHE_STORE=database    # 'redis' en producción
QUEUE_CONNECTION=database
```

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para configuración completa de producción.
