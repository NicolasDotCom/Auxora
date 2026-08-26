# 🏗️ Arquitectura del Proyecto - Sistema de Tickets

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Modelos y Relaciones](#modelos-y-relaciones)
- [Controladores](#controladores)
- [Rutas](#rutas)
- [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
- [Frontend - React & Inertia](#frontend---react--inertia)
- [Flujo de Trabajo del Sistema](#flujo-de-trabajo-del-sistema)
- [Características Avanzadas](#características-avanzadas)

---

## 📖 Descripción General

Sistema de gestión de tickets de soporte técnico desarrollado con **Laravel 12** (backend), **Inertia.js** (bridge) y **React 19** (frontend). Permite la gestión completa del ciclo de vida de tickets, con sistema de roles dinámico, seguimiento de repuestos pendientes, comentarios con adjuntos, y generación de reportes.

### Casos de Uso Principales
- **Clientes**: Crear tickets, hacer seguimiento de sus solicitudes
- **Comerciales**: Crear tickets para clientes, gestionar casos
- **Técnicos de Soporte**: Actualizar estado de tickets asignados, agregar comentarios
- **Coordinadores**: Supervisar tickets, gestionar repuestos pendientes
- **Administradores**: Control total del sistema, reportes, configuración

---

## 🛠️ Stack Tecnológico

### Backend
- **Laravel 12** - Framework PHP
- **PHP 8.2+** - Lenguaje de programación
- **MySQL/MariaDB** - Base de datos
- **Spatie Laravel Permission** - Sistema de roles y permisos

### Frontend
- **React 19** - Biblioteca de UI
- **Inertia.js** - SPA sin API
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS

### Herramientas Adicionales
- **Laravel Excel (Maatwebsite)** - Exportación de datos
- **DomPDF** - Generación de PDFs
- **AWS S3** - Almacenamiento de archivos (opcional)
- **Resend** - Servicio de emails (opcional)

---

## 📁 Estructura de Carpetas

```
ticket_tes/
│
├── app/
│   ├── Console/Commands/          # Comandos Artisan personalizados
│   ├── Exports/
│   │   └── TicketsExport.php      # Exportación de tickets a Excel
│   ├── Helpers/
│   │   ├── DateHelper.php         # Utilidades de fechas
│   │   └── WorkingDaysHelper.php  # Cálculo de días laborables
│   ├── Http/
│   │   ├── Controllers/           # Lógica de negocio
│   │   │   ├── Auth/              # Autenticación
│   │   │   ├── Settings/          # Configuración del sistema
│   │   │   ├── CustomerController.php
│   │   │   ├── SupportController.php
│   │   │   ├── TicketController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── RoleController.php
│   │   │   ├── UserController.php
│   │   │   ├── PendingPartController.php
│   │   │   ├── HolidayController.php
│   │   │   └── BackupController.php
│   │   ├── Middleware/            # Middleware personalizados
│   │   └── Requests/              # Form requests (validación)
│   ├── Models/                    # Modelos Eloquent
│   │   ├── User.php
│   │   ├── Ticket.php
│   │   ├── Customer.php
│   │   ├── Support.php
│   │   ├── TicketComment.php
│   │   ├── TicketCommentAttachment.php
│   │   ├── TicketDocument.php
│   │   ├── TicketHistory.php
│   │   ├── PendingPart.php
│   │   └── Holiday.php
│   └── Providers/                 # Service providers
│
├── config/                        # Archivos de configuración
│   ├── app.php                    # Configuración general
│   ├── database.php               # Conexión BD
│   ├── mail.php                   # Configuración email
│   ├── filesystems.php            # Storage (S3, local)
│   └── permission.php             # Roles y permisos
│
├── database/
│   ├── migrations/                # Migraciones de BD
│   └── seeders/                   # Datos iniciales
│
├── resources/
│   ├── js/
│   │   ├── components/            # Componentes React reutilizables
│   │   ├── layouts/               # Layouts de la aplicación
│   │   ├── pages/                 # Páginas de Inertia
│   │   │   ├── auth/              # Login, registro
│   │   │   ├── Customers/         # Gestión de clientes
│   │   │   ├── Supports/          # Gestión de técnicos
│   │   │   ├── Tickets/           # Gestión de tickets
│   │   │   ├── Users/             # Gestión de usuarios
│   │   │   ├── Roles/             # Gestión de roles
│   │   │   ├── PendingParts/      # Repuestos pendientes
│   │   │   ├── settings/          # Configuración
│   │   │   ├── Analytics/         # Reportes y analíticas
│   │   │   └── DashboardNew.tsx   # Dashboard principal
│   │   ├── types/                 # Tipos TypeScript
│   │   ├── hooks/                 # Custom hooks
│   │   └── utils/                 # Utilidades
│   └── views/                     # Vistas de Blade (mínimas)
│
├── routes/
│   ├── web.php                    # Rutas principales
│   ├── auth.php                   # Rutas de autenticación
│   ├── settings.php               # Rutas de configuración
│   └── console.php                # Comandos de consola
│
└── storage/
    ├── app/
    │   ├── public/                # Archivos públicos
    │   │   └── ticket-documents/  # Documentos de tickets
    │   └── backups/               # Backups del sistema
    └── logs/                      # Logs de la aplicación
```

---

## 🗃️ Modelos y Relaciones

### User
**Propósito**: Usuarios del sistema (admin, soporte, clientes, comerciales)

**Relaciones**:
- `hasMany(Ticket)` - Tickets creados por el usuario
- `hasMany(TicketComment)` - Comentarios del usuario
- `hasMany(PendingPart)` - Repuestos solicitados
- `roles()` - Roles asignados (Spatie)
- `permissions()` - Permisos directos (Spatie)

### Ticket
**Propósito**: Solicitud de soporte técnico

**Atributos principales**:
```php
- user_id         // Creador del ticket
- customer_id     // Cliente afectado
- support_id      // Técnico asignado
- subject         // Asunto
- description     // Descripción del problema
- status          // Open, In Progress, Closed
- phone           // Teléfono de contacto
- nombre_contacto // Nombre del contacto
- address         // Dirección
- brand, model, serial // Equipo afectado
- ciudad          // Ciudad
- assigned_at     // Fecha de asignación
- closed_at       // Fecha de cierre
```

**Relaciones**:
- `belongsTo(Customer)` - Cliente relacionado
- `belongsTo(Support)` - Técnico asignado
- `belongsTo(User)` - Creador del ticket
- `hasMany(TicketDocument)` - Documentos adjuntos
- `hasMany(TicketComment)` - Comentarios del ticket
- `hasMany(TicketHistory)` - Historial de cambios
- `hasMany(PendingPart)` - Repuestos pendientes

### Customer
**Propósito**: Clientes del negocio

**Atributos principales**:
```php
- name      // Nombre de la empresa
- email     // Email de contacto
- name_user // Nombre del usuario de contacto
- phone     // Teléfono
```

**Relaciones**:
- `hasMany(Ticket)` - Tickets del cliente

### Support
**Propósito**: Técnicos de soporte

**Atributos principales**:
```php
- name        // Nombre del técnico
- email       // Email
- phone       // Teléfono
- speciality  // Especialidad técnica
```

**Relaciones**:
- `hasMany(Ticket)` - Tickets asignados

### TicketComment
**Propósito**: Comentarios en tickets

**Atributos principales**:
```php
- ticket_id  // Ticket relacionado
- user_id    // Usuario que comenta
- comment    // Contenido del comentario
```

**Relaciones**:
- `belongsTo(Ticket)` - Ticket padre
- `belongsTo(User)` - Autor del comentario
- `hasMany(TicketCommentAttachment)` - Archivos adjuntos

### TicketCommentAttachment
**Propósito**: Archivos adjuntos en comentarios

**Relaciones**:
- `belongsTo(TicketComment)` - Comentario padre

### TicketDocument
**Propósito**: Documentos adjuntos al ticket

**Atributos principales**:
```php
- ticket_id    // Ticket relacionado
- file_name    // Nombre original
- file_path    // Ruta de almacenamiento
- file_type    // Tipo MIME
- file_size    // Tamaño en bytes
```

**Relaciones**:
- `belongsTo(Ticket)` - Ticket padre

### TicketHistory
**Propósito**: Registro de cambios en el ticket

**Relaciones**:
- `belongsTo(Ticket)` - Ticket modificado
- `belongsTo(User)` - Usuario que realizó el cambio

### PendingPart
**Propósito**: Repuestos pendientes de un ticket

**Atributos principales**:
```php
- ticket_id           // Ticket relacionado
- user_id             // Usuario que solicita
- part_name           // Nombre del repuesto
- part_code           // Código del repuesto
- status              // pending, completed
- completed_by_user_id // Quién lo completó
- completed_at        // Cuándo se completó
```

**Relaciones**:
- `belongsTo(Ticket)` - Ticket padre
- `belongsTo(User)` - Solicitante
- `belongsTo(User, 'completed_by_user_id')` - Quien completó

### Holiday
**Propósito**: Días festivos para cálculos de SLA

**Atributos principales**:
```php
- name  // Nombre del festivo
- date  // Fecha
```

---

## 🎮 Controladores

### TicketController
**Ubicación**: `app/Http/Controllers/TicketController.php`

**Responsabilidades**:
- Gestión CRUD de tickets
- Asignación de tickets a técnicos
- Actualización de estados
- Gestión de comentarios
- Subida/descarga de documentos
- Historial de cambios

**Métodos principales**:
```php
index()              // Listado con filtros por rol
create()             // Formulario de creación
store()              // Guardar nuevo ticket
show($id)            // Ver detalles del ticket
edit($id)            // Formulario de edición
update($id)          // Actualizar ticket
destroy($id)         // Eliminar ticket
updateStatus($id)    // Actualizar solo el estado
storeComment($id)    // Agregar comentario
downloadDocument()   // Descargar documento
deleteDocument()     // Eliminar documento
```

**Permisos requeridos**:
- `view ticket` - Ver tickets
- `create ticket` - Crear tickets
- `edit ticket` - Editar tickets

### CustomerController
**Ubicación**: `app/Http/Controllers/CustomerController.php`

**Responsabilidades**:
- CRUD de clientes
- Validación de datos de clientes

**Permisos requeridos**:
- `view customer`, `create customer`, `edit customer`, `delete customer`

### SupportController
**Ubicación**: `app/Http/Controllers/SupportController.php`

**Responsabilidades**:
- CRUD de técnicos de soporte
- Validación de especialidades

**Permisos requeridos**:
- `view support`, `create support`, `edit support`, `delete support`

### DashboardController
**Ubicación**: `app/Http/Controllers/DashboardController.php`

**Responsabilidades**:
- Estadísticas del dashboard
- Exportación de tickets (Excel y PDF)
- Análisis de técnicos
- Gráficas y métricas

**Métodos principales**:
```php
index()                  // Dashboard con estadísticas
exportView()             // Vista de exportación
exportTickets()          // Exportar a Excel
exportTicketsPdf()       // Exportar a PDF
getTechnicianAnalytics() // Análisis de técnicos
```

### RoleController
**Ubicación**: `app/Http/Controllers/RoleController.php`

**Responsabilidades**:
- Gestión de roles
- Asignación de permisos a roles

### UserController
**Ubicación**: `app/Http/Controllers/UserController.php`

**Responsabilidades**:
- CRUD de usuarios
- Asignación de roles a usuarios

### PendingPartController
**Ubicación**: `app/Http/Controllers/PendingPartController.php`

**Responsabilidades**:
- Listado de repuestos pendientes
- Crear solicitud de repuesto
- Actualizar estado de repuesto

**Acceso**: Solo `admin`, `support` y `Coordinador`

### HolidayController
**Ubicación**: `app/Http/Controllers/HolidayController.php`

**Responsabilidades**:
- CRUD de días festivos
- Cálculo de días laborables

**Acceso**: Solo `admin`

### BackupController
**Ubicación**: `app/Http/Controllers/BackupController.php`

**Responsabilidades**:
- Crear backups de documentos
- Restaurar backups
- Listar backups disponibles

**Acceso**: Solo `admin`

---

## 🛣️ Rutas

### Rutas Públicas
```php
GET  /          → Redirect to login
GET  /login     → Página de login
POST /login     → Autenticar usuario
GET  /register  → Página de registro
POST /register  → Registrar usuario
```

### Rutas Autenticadas (middleware: auth, verified)

#### Tickets
```php
GET     /tickets              → Lista de tickets
GET     /tickets/create       → Formulario de creación
POST    /tickets              → Guardar nuevo ticket
GET     /tickets/{id}         → Ver ticket
GET     /tickets/{id}/edit    → Editar ticket
PUT     /tickets/{id}         → Actualizar ticket
DELETE  /tickets/{id}         → Eliminar ticket
PATCH   /tickets/{id}/status  → Actualizar estado
```

#### Documentos de Tickets
```php
GET    /ticket-documents/{id}/download → Descargar documento
DELETE /ticket-documents/{id}          → Eliminar documento
```

#### Comentarios
```php
POST /tickets/{id}/comments           → Agregar comentario
GET  /comment-attachments/{id}/download → Descargar adjunto
```

#### Repuestos Pendientes (solo admin, support, Coordinador)
```php
GET   /pending-parts              → Lista de repuestos
POST  /pending-parts              → Crear repuesto
PATCH /pending-parts/{id}/status  → Actualizar estado
```

#### Clientes y Técnicos
```php
Resource /customers  → CRUD de clientes
Resource /supports   → CRUD de técnicos
```

### Rutas Solo Admin (middleware: auth, verified, role:admin)

#### Dashboard y Reportes
```php
GET /dashboard                      → Dashboard principal
GET /export-tickets                 → Vista de exportación
GET /dashboard/export-tickets       → Exportar Excel
GET /dashboard/export-tickets-pdf   → Exportar PDF
GET /analytics/technicians          → Análisis de técnicos
```

#### Configuración
```php
GET    /settings/holidays     → Gestión de festivos
POST   /settings/holidays     → Crear festivo
PUT    /settings/holidays/{id} → Actualizar festivo
DELETE /settings/holidays/{id} → Eliminar festivo
```

#### Backups
```php
GET    /settings/backups           → Lista de backups
POST   /settings/backups/upload    → Subir backup
POST   /settings/backups/{file}/restore → Restaurar backup
DELETE /settings/backups/{file}    → Eliminar backup
```

---

## 🔐 Sistema de Roles y Permisos

### Roles Predefinidos

#### Admin
- **Acceso total** al sistema
- Gestión de usuarios, roles y permisos
- Configuración del sistema
- Reportes y analíticas
- Backups

#### Support (Técnico de Soporte)
- Ver y actualizar **solo tickets asignados a él**
- Agregar comentarios y documentos
- Gestionar repuestos pendientes
- No puede crear/editar clientes o técnicos

#### Coordinador
- Supervisar todos los tickets
- Gestionar repuestos pendientes
- Asignar tickets a técnicos
- Ver reportes

#### Customer (Cliente)
- Ver **solo tickets que él creó**
- Agregar comentarios a sus tickets
- Ver el estado de sus solicitudes

#### Comercial
- Crear tickets para clientes
- Ver tickets que él creó
- Agregar comentarios

### Permisos Disponibles

**Tickets**:
- `view ticket` - Ver tickets
- `create ticket` - Crear tickets
- `edit ticket` - Editar tickets
- `delete ticket` - Eliminar tickets

**Clientes**:
- `view customer`, `create customer`, `edit customer`, `delete customer`

**Técnicos**:
- `view support`, `create support`, `edit support`, `delete support`

**Usuarios**:
- `view user`, `create user`, `edit user`, `delete user`

**Roles**:
- `view role`, `create role`, `edit role`, `delete role`

### Comandos para Gestión de Roles

```bash
# Listar roles
php artisan role:list

# Ver un rol específico
php artisan role:list --role=Coordinador

# Ver todos los permisos
php artisan role:list --permissions

# Crear nuevo rol
php artisan role:create "Supervisor"

# Crear rol con permisos
php artisan role:create "Técnico Junior" \
  --permissions="view ticket" \
  --permissions="create ticket" \
  --permissions="edit ticket"
```

### Middleware de Permisos

```php
// En controladores
$this->middleware('permission:view ticket')->only(['index', 'show']);
$this->middleware('permission:create ticket')->only(['create', 'store']);

// En rutas
Route::middleware(['permission:edit ticket'])->group(function () {
    // Rutas protegidas
});

// Por rol
Route::middleware(['role:admin'])->group(function () {
    // Solo administradores
});

// Múltiples roles
Route::middleware(['role:admin|support|Coordinador'])->group(function () {
    // Varios roles permitidos
});
```

---

## ⚛️ Frontend - React & Inertia

### Estructura de Páginas

```
resources/js/pages/
├── auth/
│   ├── Login.tsx              # Página de login
│   └── Register.tsx           # Página de registro
├── Customers/
│   ├── Index.tsx              # Lista de clientes
│   ├── Create.tsx             # Crear cliente
│   └── Edit.tsx               # Editar cliente
├── Supports/
│   ├── Index.tsx              # Lista de técnicos
│   ├── Create.tsx             # Crear técnico
│   └── Edit.tsx               # Editar técnico
├── Tickets/
│   ├── Index.tsx              # Lista de tickets
│   ├── Create.tsx             # Crear ticket
│   ├── Edit.tsx               # Editar ticket
│   └── Show.tsx               # Ver detalles del ticket
├── Users/
│   ├── Index.tsx              # Lista de usuarios
│   ├── Create.tsx             # Crear usuario
│   └── Edit.tsx               # Editar usuario
├── Roles/
│   ├── Index.tsx              # Lista de roles
│   ├── Create.tsx             # Crear rol
│   └── Edit.tsx               # Editar rol
├── PendingParts/
│   └── Index.tsx              # Repuestos pendientes
├── Analytics/
│   └── Technicians.tsx        # Análisis de técnicos
├── settings/
│   ├── Holidays.tsx           # Gestión de festivos
│   └── Backups.tsx            # Gestión de backups
├── DashboardNew.tsx           # Dashboard principal
└── ExportTickets.tsx          # Exportación de tickets
```

### Componentes Reutilizables

```
resources/js/components/
├── ui/                        # Componentes de UI básicos
├── forms/                     # Componentes de formularios
├── tables/                    # Componentes de tablas
└── layouts/                   # Layouts compartidos
```

### Layouts

**MainLayout**: Layout principal con sidebar y header
- Sidebar dinámico basado en permisos
- Notificaciones flash
- Menú de usuario

### Comunicación Backend-Frontend

**Inertia.js** actúa como puente:

```php
// Backend (Controller)
return Inertia::render('Tickets/Index', [
    'tickets' => $tickets,
    'filters' => $filters,
]);
```

```tsx
// Frontend (React)
import { usePage } from '@inertiajs/react';

const { tickets, filters } = usePage().props;
```

### Formularios con Inertia

```tsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({
    subject: '',
    description: '',
});

const submit = (e) => {
    e.preventDefault();
    post(route('tickets.store'));
};
```

---

## 🔄 Flujo de Trabajo del Sistema

### 1. Creación de Ticket

```
1. Cliente/Comercial accede a /tickets/create
2. Completa formulario con:
   - Cliente afectado
   - Descripción del problema
   - Datos del equipo (marca, modelo, serie)
   - Ubicación y contacto
3. Puede adjuntar documentos (fotos, facturas)
4. Submit → TicketController@store
5. Se crea ticket con estado "Open"
6. Se registra en TicketHistory
7. Redirect a /tickets con mensaje de éxito
```

### 2. Asignación de Ticket

```
1. Admin/Coordinador edita ticket
2. Selecciona técnico de soporte
3. Cambia estado a "In Progress"
4. Se registra assigned_at
5. Técnico puede ver el ticket en su lista
```

### 3. Trabajo del Técnico

```
1. Técnico ve solo sus tickets asignados
2. Puede agregar comentarios con adjuntos
3. Si falta repuesto:
   - Crea PendingPart desde el ticket
   - Estado: "pending"
4. Actualiza estado del ticket según progreso
5. Al finalizar, marca ticket como "Closed"
6. Se registra closed_at
```

### 4. Gestión de Repuestos

```
1. Admin/Coordinador ve /pending-parts
2. Lista todos los repuestos pendientes
3. Al recibir repuesto:
   - Actualiza estado a "completed"
   - Se registra completed_by_user_id y completed_at
4. Técnico puede continuar con el ticket
```

### 5. Seguimiento por Cliente

```
1. Cliente ve /tickets
2. Lista solo sus tickets
3. Puede ver detalles y comentarios
4. Puede agregar comentarios adicionales
5. Recibe notificaciones de cambios de estado
```

### 6. Reportes y Analíticas

```
1. Admin accede a /analytics/technicians
2. Ve métricas:
   - Tickets por técnico
   - Tiempo promedio de resolución
   - Tasa de cierre
   - Repuestos pendientes
3. Exporta datos a Excel/PDF
```

---

## 🚀 Características Avanzadas

### 1. Sistema de Archivos Flexible

**Soporte para múltiples drivers**:
- Local (desarrollo)
- AWS S3 (producción)

**Ubicaciones**:
- `storage/app/public/ticket-documents/` - Documentos de tickets
- `storage/app/public/comment-attachments/` - Adjuntos de comentarios

**Configuración** en `.env`:
```env
FILESYSTEM_DISK=local  # o 's3'
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=
```

### 2. Backups Automatizados

**Características**:
- Backup de documentos en ZIP
- Restauración desde interfaz web
- Historial de backups
- Solo accesible para admin

**Ubicación**: `storage/app/backups/`

### 3. Cálculo de Días Laborables

**Helper**: `WorkingDaysHelper`

**Funcionalidad**:
- Excluye sábados y domingos
- Excluye días festivos de la tabla `holidays`
- Útil para SLA y tiempos de resolución

### 4. Historial de Cambios

**Modelo**: `TicketHistory`

**Registra**:
- Cambios de estado
- Asignaciones de técnico
- Modificaciones de datos
- Usuario y timestamp de cada cambio

### 5. Comentarios con Adjuntos

**Características**:
- Comentarios ilimitados por ticket
- Múltiples archivos por comentario
- Descarga individual de adjuntos
- Visible para todos los involucrados

### 6. Exportación de Datos

**Formatos disponibles**:
- Excel (.xlsx) - Usando Maatwebsite/Excel
- PDF - Usando DomPDF

**Filtros**:
- Por rango de fechas
- Por estado
- Por técnico
- Por cliente

### 7. Dashboard Dinámico

**Métricas**:
- Total de tickets
- Tickets abiertos
- Tickets en progreso
- Tickets cerrados
- Repuestos pendientes
- Tiempo promedio de resolución
- Gráficos de tendencias

### 8. Sidebar Dinámico

**Funcionamiento**:
- Se genera según permisos del usuario
- No requiere modificación para nuevos roles
- Oculta opciones sin permiso automáticamente

### 9. Verificación de Email

**Configuración** en `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
```

**Activación**:
- Middleware `verified` en rutas
- Email de verificación automático
- Resend disponible

### 10. Multi-idioma

**Ubicación**: `lang/es.json`, `lang/es/`

**Soporte**:
- Español (por defecto)
- Fácilmente extensible a otros idiomas

---

## 📝 Notas para Desarrollo

### Agregar Nueva Funcionalidad

1. **Crear Migración**:
```bash
php artisan make:migration create_nueva_tabla
```

2. **Crear Modelo**:
```bash
php artisan make:model NuevaTabla
```

3. **Crear Controlador**:
```bash
php artisan make:controller NuevaTablaController --resource
```

4. **Definir Rutas** en `routes/web.php`:
```php
Route::resource('nueva-tabla', NuevaTablaController::class);
```

5. **Crear Permisos** (si es necesario):
```bash
php artisan role:create "NuevoRol" --permissions="view nueva-tabla"
```

6. **Crear Componente React**:
```bash
# En resources/js/pages/NuevaTabla/
Index.tsx
Create.tsx
Edit.tsx
```

### Debugging

**Logs**: `storage/logs/laravel.log`

**Comandos útiles**:
```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Ver rutas
php artisan route:list

# Ver permisos
php artisan role:list --permissions

# Recompilación de assets
pnpm run build
```

### Testing

```bash
# Ejecutar tests
php artisan test

# Con cobertura
php artisan test --coverage
```

---

## 🔗 Documentación Adicional

- [README.md](README.md) - Instalación y configuración inicial
- [ROLES.md](ROLES.md) - Sistema de roles y permisos
- [EMAIL.md](EMAIL.md) - Configuración de emails (Resend, SMTP)
- [STORAGE.md](STORAGE.md) - Configuración de almacenamiento (S3)
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy, Redis, autenticación en producción
- [API.md](API.md) - API REST de solo lectura

---

**Última actualización**: 21 de enero de 2026
**Versión del proyecto**: Laravel 12 + React 19
