# 03 — Modelos y Relaciones

10 modelos Eloquent. Núcleo: `Ticket` con 5 relaciones salientes.

## User (`app/Models/User.php`)

```php
class User extends Authenticatable implements MustVerifyEmail {
    use HasApiTokens, HasFactory, Notifiable, HasRoles;
}

protected $fillable = ['name', 'email', 'password', 'ciudad'];
protected $hidden   = ['password', 'remember_token'];

// Casts
'email_verified_at' => 'datetime',
'password'          => 'hashed',
```

| Relación | Tipo | Modelo |
|----------|------|--------|
| `customer()` | hasOne | Customer (match por email) |
| `roles()` | morphToMany | Role (Spatie) |
| `permissions()` | morphToMany | Permission (Spatie) |
| `tickets()` | hasMany | Ticket (donde `user_id` = id) |

```php
$user->hasRole('admin');
$user->hasRole(['admin', 'Coordinador']);           // OR
$user->hasPermissionTo('view ticket');
$user->getRoleNames();                              // Collection<string>
$user->getAllPermissions()->pluck('name');
```

## Ticket (`app/Models/Ticket.php`) — modelo principal

```php
protected $fillable = [
    'request_uuid',     // UUID para idempotencia API
    'user_id',          // Creador
    'customer_id',      // Cliente afectado (FK)
    'cliente_externo',  // Nombre si cliente no registrado
    'support_id',       // Técnico asignado (FK)
    'assigned_at',
    'subject',          // ENUM (ver abajo)
    'description',
    'phone', 'nombre_contacto', 'address',
    'brand', 'model', 'serial',
    'status',           // ENUM: 'Open', 'In Progress', 'Closed'
    'ciudad',
    'closed_at',
];

protected $casts = [
    'assigned_at' => 'datetime',
    'closed_at'   => 'datetime',
];
```

**Valores de `subject`:** `Soporte, Mantenimiento, Instalación, Configuración, Capacitación, Actualización, Reparación, Diagnóstico, Cambio de equipo, Reinstalación, Asesoría, Limpieza, Cambio de componentes, Revisión, Otro, Contadores, Código de error`

| Relación | Tipo | Modelo |
|----------|------|--------|
| `customer()` | belongsTo | Customer |
| `support()` | belongsTo | Support |
| `user()` | belongsTo | User (creador) |
| `documents()` | hasMany | TicketDocument |
| `comments()` | hasMany | TicketComment |
| `histories()` | hasMany | TicketHistory (ordenado desc) |
| `pendingParts()` | hasMany | PendingPart |

**Query pattern con visibilidad por rol:**
```php
$tickets = Ticket::query()
    ->select('id', 'customer_id', 'support_id', 'subject', 'status', /* ... */)
    ->with(['customer:id,name,email', 'support:id,name', 'user:id,name'])
    ->withCount('documents');

// Support solo ve los suyos
$tickets->where('support_id', $support->id);
// Customer solo ve los suyos
$tickets->where('customer_id', $customer->id);
// Comercial solo ve los que creó
$tickets->where('user_id', $userId);
```

## Customer (`app/Models/Customer.php`)

```php
protected $fillable = [
    'name', 'name_user', 'email', 'phone',
    'nit', 'additional_nits',  // additional_nits es JSON
];

// Relación
hasMany(Ticket)
```

## Support (`app/Models/Support.php`)

```php
protected $fillable = ['name', 'email', 'phone', 'speciality'];

// Especialidades: Hardware, Software, Redes, Impresoras, Servidores
// Relación
hasMany(Ticket)  // donde support_id = id
```

## TicketComment (`app/Models/TicketComment.php`)

```php
protected $fillable = ['ticket_id', 'user_id', 'comment'];

// belongsTo(Ticket), belongsTo(User), hasMany(TicketCommentAttachment)
```

## TicketCommentAttachment

```php
protected $fillable = ['ticket_comment_id', 'file_name', 'file_path', 'file_type', 'file_size'];

// belongsTo(TicketComment)
```

## TicketDocument

```php
protected $fillable = ['ticket_id', 'file_name', 'file_path', 'file_type', 'file_size', 'uploaded_by'];

// belongsTo(Ticket), belongsTo(User, 'uploaded_by')
```

## TicketHistory

```php
protected $fillable = [
    'ticket_id', 'user_id',
    'action',       // 'created', 'status_changed', 'assigned', 'updated', 'commented', 'document_added'
    'field',        // Campo modificado (nullable)
    'old_value', 'new_value',
    'description',  // Texto del cambio
];

// belongsTo(Ticket), belongsTo(User)
```

## PendingPart

```php
protected $fillable = [
    'ticket_id', 'user_id',
    'part_name', 'part_code',
    'status',              // 'pending' | 'completed'
    'completed_by_user_id', 'completed_at',
    'notes',
];

// belongsTo(Ticket), belongsTo(User), belongsTo(User, 'completed_by_user_id')
```

## Holiday

```php
protected $fillable = ['name', 'date'];
protected $casts = ['date' => 'date'];

// Cacheado vía CacheService::getHolidays($year)
```

## Diagrama de relaciones

```
                    ┌──────────┐
                    │   User   │
                    └─────┬────┘
                          │ (creator)
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌────────┐      ┌──────────┐      ┌─────────────┐
   │ Ticket │◄─────┤ Customer │      │ PendingPart │
   └───┬────┘      └──────────┘      └─────────────┘
       │
       ├──► support (Support)
       ├──► documents (TicketDocument) ──► 1:N
       ├──► comments (TicketComment) ──► 1:N
       │       └──► attachments (TicketCommentAttachment)
       ├──► histories (TicketHistory) ──► 1:N
       └──► pendingParts (PendingPart) ──► 1:N
```

## Índices importantes

Definidos en migraciones `2026_01_05_*`, `2026_01_23_*`, `2026_03_26_*`:

```sql
-- tickets
INDEX (subject, status, serial, customer_id, support_id, user_id),
INDEX (created_at, assigned_at, closed_at, ciudad, request_uuid),
INDEX (status, support_id), INDEX (status, created_at),  -- Compuestos

-- customers: INDEX (name), INDEX (email)
-- supports: INDEX (email), INDEX (speciality)
-- users: INDEX (email), INDEX (ciudad)
-- ticket_documents/comments/histories: INDEX (ticket_id)
```

## Convenciones

```php
// 1. Siempre declarar $fillable (NUNCA $guarded = [])
protected $fillable = ['campo1', 'campo2'];

// 2. Casts para fechas y tipos
protected $casts = ['fecha' => 'datetime', 'activo' => 'boolean'];

// 3. Relaciones con tipos de retorno
public function customer(): BelongsTo
{
    return $this->belongsTo(Customer::class);
}

// 4. Scopes reutilizables
public function scopeOpen($query)
{
    return $query->where('status', 'Open');
}

// 5. Accessors para campos calculados
public function getIsClosedAttribute(): bool
{
    return $this->status === 'Closed';
}
```

## Anti-patrones

❌ `$guarded = []` (mass-assignment)  
❌ Omitir `with()` → N+1  
❌ `Model::all()` sin paginar  
❌ Lógica de negocio en modelos (usar Services)  
❌ Exponer relaciones innecesarias en `toArray()` (usar `$hidden`)
