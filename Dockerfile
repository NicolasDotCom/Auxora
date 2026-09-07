# syntax=docker/dockerfile:1.6

# ---------- Stage 1: build JS ----------
FROM node:20-bookworm-slim AS frontend
ENV CI=true \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile
COPY resources ./resources
COPY vite.config.ts tsconfig.json ./
RUN pnpm run build

# ---------- Stage 2: vendor + app ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --ignore-platform-req=ext-bcmath \
        --no-interaction \
        --no-progress \
        --prefer-dist \
        --optimize-autoloader

# ---------- Stage 3: runtime ----------
FROM php:8.3-fpm-bookworm AS runtime
ARG APP_ENV=production
ENV APP_ENV=${APP_ENV} \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx supervisor libpq-dev libzip-dev libicu-dev libpng-dev \
        libjpeg-dev libfreetype6-dev libonig-dev libxml2-dev unzip git \
        libssl-dev libcurl4-openssl-dev ca-certificates tzdata \
    && docker-php-ext-install pdo pdo_mysql mbstring zip intl bcmath gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Composer (CLI within container for artisan commands)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# App code
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build
COPY . .

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Nginx + supervisor configs
RUN mkdir -p /etc/supervisor/conf.d /run/nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]