# API de Tickets (Solo Consulta)

Esta API permite consultar tickets y comentarios de tickets.
No permite crear, editar ni eliminar informacion.

## 1. Seguridad

- Tipo de autenticacion: Bearer Token (Laravel Sanctum).
- Ability requerida: tickets:read.
- Rate limit: 90 solicitudes por minuto por token (o por usuario/IP si aplica).
- Si el token no es valido: respuesta 401.
- Si el token no tiene permisos: respuesta 403.

## 2. Como crear un token

1. Inicia sesion en la aplicacion web.
2. Ve a /settings/api-tokens.
3. Crea un token con permiso tickets:read.
4. Copia el token generado (solo se muestra una vez).

## 3. URL base

- Base produccion: https://tickets-app-main-dbvpcm.laravel.cloud/api/v1
- Base local: http://localhost:8000/api/v1
- En este proyecto tambien puedes verlo dinamico desde la demo en /api-demo/tickets.

## 4. Endpoints disponibles

### 4.1 Listar tickets

- Metodo: GET
- URL: /api/v1/tickets
- Query params opcionales:
  - ticket_id: numero de ticket exacto
  - company_name: nombre de empresa (cliente interno o externo)
  - support_id: ID del tecnico de soporte asignado
  - status: Open | In Progress | Closed
  - search: texto libre (busca en asunto, descripcion, serial y cliente_externo)
  - page: 1 a 1000
  - per_page: 1 a 50 (default 15)

Ejemplo cURL:

```bash
curl -X GET "http://localhost:8000/api/v1/tickets?status=Open&per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

### 4.2 Ver detalle de un ticket

- Metodo: GET
- URL: /api/v1/tickets/{ticket}

Ejemplo cURL:

```bash
curl -X GET "http://localhost:8000/api/v1/tickets/123" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

### 4.3 Listar comentarios de un ticket

- Metodo: GET
- URL: /api/v1/tickets/{ticket}/comments
- Query params opcionales:
  - page: 1 a 1000
  - per_page: 1 a 50 (default 20)

Ejemplo cURL:

```bash
curl -X GET "http://localhost:8000/api/v1/tickets/123/comments" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

## 5. Respuestas comunes

- 200 OK: consulta exitosa.
- 401 Unauthorized: token ausente o invalido.
- 403 Forbidden: token sin ability tickets:read.
- 404 Not Found: ticket no existe.
- 422 Unprocessable Entity: query params invalidos.
- 429 Too Many Requests: se supero el limite de solicitudes por minuto.

## 6. Demo web incluida

Hay una interfaz de prueba en /api-demo/tickets.

- Permite ejecutar consultas GET con token.
- Muestra respuesta completa HTTP + JSON.
- No tiene opciones de escritura.

## 7. Resumen rapido

- API actual: solo lectura.
- Ability minima necesaria: tickets:read.
- Integracion recomendada: consumir endpoints GET desde sistemas externos (CRM, BI, reportes).

## 8. Observabilidad de rendimiento

- Cada respuesta incluye headers de diagnostico:
  - X-Response-Time-Ms
  - X-DB-Time-Ms
  - X-DB-Queries
- Las solicitudes lentas se registran en logs con el evento: api.performance.slow.
- Umbrales configurables por entorno:
  - API_SLOW_REQUEST_MS (default 800)
  - API_SLOW_DB_MS (default 400)
