#!/bin/sh
set -e

echo "🔗 Creando enlace simbólico de storage..."
php artisan storage:link || true

echo "🗃️  Ejecutando migraciones..."
php artisan migrate --force --no-interaction

echo "⚡ Refrescando caché..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔥 Precacheando catálogos críticos..."
php artisan cache:warmup || true

echo "✅ Post-deploy completado en Coolify"