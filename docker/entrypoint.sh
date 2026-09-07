#!/bin/sh
set -e

cd /var/www/html

if [ ! -L "public/storage" ]; then
    php artisan storage:link --force || true
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
fi

# Comentamos el cacheo automático - causa problemas con Laravel 13
# if [ -f ".env" ]; then
#     php artisan config:cache || true
#     php artisan route:cache || true
#     php artisan view:cache || true
# fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --no-interaction
fi

exec "$@"