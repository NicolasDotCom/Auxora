# 01 — Visión General del Proyecto

## Sistema de Tickets de Soporte Técnico

Gestión integral del ciclo de vida de tickets para empresas: clientes, técnicos, coordinadores y administradores colaboran en la resolución de incidencias con equipos (marca, modelo, serial), repuestos pendientes, historial, comentarios con adjuntos y reportes.

## Características

**Dominio:**
- Tickets con ciclo `Open` → `In Progress` → `Closed`
- Asignación de técnicos con especialidades
- Comentarios con múltiples adjuntos
- Repuestos pendientes (`PendingPart`) por ticket
- Historial de cambios (`TicketHistory`)
- Clientes externos (sin `customer_id` registrado)
- Días festivos para cálculo de SLA/días laborables
- Reportes de visita (PDF) para técnicos en campo
- Reportes Excel/PDF con filtros
- Dashboard con métricas y gráficos (Recharts)
- API REST con tokens Sanctum (consumo externo)

**Técnicas:**
- Roles dinámicos con Spatie (sin hardcoding)
- Caché centralizado en `CacheService` con TTL diferenciados
- Cálculo de horas laborables (lun-vie 8-18h, sáb 9-13h, excl. festivos)
- Multi-driver storage: local (dev) / S3 (producción)
- Verificación de email obligatoria
- i18n completa en español
- Optimizado para 50+ usuarios simultáneos (Redis)

## Roles y visibilidad

| Rol | Ve tickets donde | Permisos típicos |
|-----|------------------|------------------|
| **admin** | Todos | Todos |
| **Coordinador** | Todos (no eliminar) | view/create/edit ticket, view customer/support |
| **support** | `support_id` = su ID | view/edit ticket, update status |
| **customer** | `customer_id` = su customer | view/create ticket |
| **Comercial** | `user_id` = él | view/create ticket |

El patrón de visibilidad se aplica en `TicketController@index` y similares. Detalle en [10-common-patterns.md](10-common-patterns.md).

## Casos de uso

**1. Cliente/Comercial crea ticket**
→ `/tickets/create` → selecciona cliente, completa equipo (marca/modelo/serial), adjunta documentos → estado inicial `Open`.

**2. Coordinador asigna a técnico**
→ edita ticket → selecciona técnico → estado cambia a `In Progress` → se registra `assigned_at`.

**3. Técnico trabaja el ticket**
→ ve solo sus tickets asignados → agrega comentarios con adjuntos → si falta repuesto crea `PendingPart` → al cerrar, `closed_at` se registra.

**4. Admin/Coordinador gestiona repuestos**
→ `/pending-parts` → marca como `completed` al recibir → registra `completed_by_user_id` y `completed_at`.

**5. Admin consulta reportes**
→ `/dashboard` y `/analytics/technicians` → métricas, ranking de técnicos, exportación Excel/PDF.

## Credenciales por defecto (después de seeders)

- **Email:** `admin@tickets.com`
- **Password:** `password`

> Cambiar inmediatamente en producción.

## Internacionalización

- Idioma principal: español (`lang/es/`)
- Validaciones: `lang/es/validation.php` (traducidas)

## Estructura de alto nivel

```
app/
├── Console/Commands/      # Comandos Artisan (roles, health, backups)
├── Exports/              # TicketsExport (Maatwebsite Excel)
├── Helpers/              # DateHelper, WorkingDaysHelper
├── Http/
│   ├── Controllers/      # Lógica de endpoints
│   ├── Middleware/       # HandleInertiaRequests, ApiPerformanceMonitor
│   └── Requests/         # Form Requests (validación)
├── Models/               # 10 modelos Eloquent
├── Providers/            # Service Providers
└── Services/             # CacheService (lógica compartida)

database/
├── factories/            # Factories para tests/seeders
├── migrations/           # 40+ migraciones
└── seeders/              # Datos iniciales

resources/
├── js/                   # React 19 + TS + Inertia
└── views/                # Vistas Blade (solo exports PDF)

routes/                   # web.php, auth.php, api.php, settings.php
tests/                    # Pest tests
```

## Fuera de alcance

- Notificaciones en tiempo real (WebSockets)
- App móvil nativa (solo API REST para integraciones)
- Facturación/cobros
- Chat en vivo
- Integración con calendarios externos

## Métricas de negocio

- Tiempo promedio de resolución (horas laborables)
- Tasa de cierre (% cerrados vs abiertos)
- Tickets por técnico (ranking)
- Repuestos pendientes por ticket
- Tickets por especialidad de soporte
- Tickets por ciudad
