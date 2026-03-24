# =============================================================================
# SABC Eval360 - Multi-stage Dockerfile
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Composer dependencies
# -----------------------------------------------------------------------------
FROM composer:2.6 AS composer

WORKDIR /app

COPY composer.json composer.lock ./
# --ignore-platform-reqs: ext-sockets est compilée dans le stage app, pas ici
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --ignore-platform-reqs

COPY . .
# --no-scripts: évite package:discover qui nécessite laravel/pail (dev-dep non installée)
# package:discover est exécuté dans l'entrypoint au démarrage du container
RUN composer dump-autoload --optimize --no-dev --ignore-platform-reqs --no-scripts

# -----------------------------------------------------------------------------
# Stage 2: Node.js build (Frontend assets)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS node

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile pour prod / --no-frozen-lockfile pour dev si lockfile désynchronisé
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 3: Application
# -----------------------------------------------------------------------------
FROM php:8.3-fpm-alpine AS app

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    libpq-dev \
    linux-headers \
    curl \
    git \
    unzip

# Install PHP extensions + Redis PECL dans le même RUN pour éviter de re-télécharger les build-deps
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        intl \
        mbstring \
        opcache \
        bcmath \
        pcntl \
        sockets \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Configure PHP
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Configure nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Configure supervisor
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set working directory
WORKDIR /var/www/html

# Copy application
COPY --from=composer /app/vendor ./vendor
COPY --from=node /app/public/build ./public/build
COPY . .

# Configure entrypoint
COPY docker/php/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Expose port
EXPOSE 80

# Start via entrypoint (package:discover + supervisord)
ENTRYPOINT ["/entrypoint.sh"]

# -----------------------------------------------------------------------------
# Stage 4: Development (optional)
# -----------------------------------------------------------------------------
FROM app AS dev

# Install development tools
RUN apk add --no-cache \
    vim \
    nano

# Install Xdebug
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del .build-deps

COPY docker/php/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

# Keep container running for development
CMD ["php-fpm"]
