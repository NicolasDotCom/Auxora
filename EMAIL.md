# Email y Verificación

## Resumen

- **Verificación de email implementada** en `app/Models/User.php` (`MustVerifyEmail`).
- **Disparo automático** del evento `Registered` en `app/Http/Controllers/UserController.php` cuando un admin crea un usuario.
- **Middleware `verified`** protege todas las rutas en `routes/web.php`.
- **Servicio recomendado:** Resend (mejor deliverability que Gmail SMTP).

## Flujo

```
1. Admin crea usuario → UserController@store
2. event(new Registered($user)) → Laravel detecta MustVerifyEmail
3. Email enviado vía driver configurado (Resend recomendado)
4. Usuario hace clic en enlace único (expira en 60 min)
5. Laravel marca email_verified_at → usuario puede acceder
```

## Configuración

### Opción A: Resend (recomendado para producción)

```env
MAIL_MAILER=resend
RESEND_KEY=re_xxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS="auxora.support@gmail.com"
MAIL_FROM_NAME="Tickets-App"
```

Requiere `composer require resend/resend-php` (incluido en `composer.json`).

**Verificar dominio en Resend** (opcional pero recomendado para evitar spam):
1. https://resend.com/domains → Add Domain
2. Configurar DNS: SPF, DKIM, DMARC
3. Una vez verificado, cambiar `MAIL_FROM_ADDRESS` a usar ese dominio.

Sin dominio verificado se puede enviar desde `onboarding@resend.dev` (límite: 100 emails/día).

### Opción B: Gmail SMTP (solo desarrollo)

1. Activar verificación en 2 pasos: https://myaccount.google.com/security
2. Generar contraseña de aplicación: https://myaccount.google.com/apppasswords

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=auxora.support@gmail.com
MAIL_PASSWORD=contraseña_de_aplicacion_16_caracteres
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="auxora.support@gmail.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Opción C: LOG (solo desarrollo, sin envío real)

```env
MAIL_MAILER=log
```

Los emails se guardan en `storage/logs/laravel.log`. Útil para debugging.

### Opción D: Otros servicios

```env
# Mailtrap (sandbox)
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525

# SendGrid
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxx

# Mailgun
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=tu-dominio.mailgun.org
MAILGUN_SECRET=key-xxxxx

# Amazon SES
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_DEFAULT_REGION=us-east-1
```

## Despliegue en Laravel Cloud

En **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `MAIL_MAILER` | `resend` |
| `RESEND_KEY` | clave de producción (diferente a dev) |
| `MAIL_FROM_ADDRESS` | `auxora.support@gmail.com` |
| `MAIL_FROM_NAME` | `Tickets-App` |

Luego forzar redeploy y ejecutar:

```bash
php artisan config:clear
```

## Probar

```bash
# Comando de prueba
php artisan test:email-verification email@ejemplo.com

# Ver emails enviados
Get-Content storage/logs/laravel.log -Tail 50    # Si MAIL_MAILER=log
https://resend.com/emails                          # Dashboard de Resend
```

## Problemas comunes

### Email no llega
1. Revisar spam
2. Verificar variables en Laravel Cloud
3. `php artisan config:clear`
4. Revisar logs: `php artisan tail` o Dashboard → Logs

### "RESEND_KEY not set"
Falta la variable en Laravel Cloud (no solo en `.env` local).

### "The gmail.com domain is not verified"
Resend no permite enviar desde `@gmail.com` sin verificar. Opciones:
- Cambiar `MAIL_FROM_ADDRESS` a `onboarding@resend.dev`
- Verificar dominio propio en Resend
- Usar `MAIL_MAILER=log` en desarrollo

### "Driver [resend] not supported"
Falta el paquete. Agregar a `composer.json`:
```json
"resend/resend-php": "^0.13.0"
```
Y ejecutar `composer install`.

### "Route [verification.notice] not defined"
```bash
php artisan route:clear
php artisan cache:clear
```

## Seguridad

- Usar claves diferentes para dev y prod.
- No subir `RESEND_KEY` a Git.
- Rotar claves cada 6-12 meses.
- Limitar permisos de las API Keys (solo envío).

## Límites de Resend (plan gratuito)

- 100 emails/día
- 3,000 emails/mes
- 10 req/segundo

Suficiente para uso actual. Plan Pro: $20/mes (50,000 emails/mes).
