FROM debian:bookworm-slim

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Dependencies
RUN apt-get update && apt-get install -y \
    lsb-release \
    ca-certificates \
    curl \
    apt-transport-https \
    gnupg \
    gettext-base \
    zip \
    unzip \
    && apt-get clean

# Sury's PHP 8.4 repository
RUN curl -sSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list

# Packages & extensions
RUN apt-get update && apt-get install -y \
    nginx \
    php8.4-cli \
    php8.4-fpm \
    php8.4-common \
    php8.4-bcmath \
    php8.4-bz2 \
    php8.4-curl \
    php8.4-fileinfo \
    php8.4-gd \
    php8.4-intl \
    php8.4-mbstring \
    php8.4-exif \
    php8.4-mysqli \
    php8.4-opcache \
    php8.4-xml \
    php8.4-zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure PHP-FPM to communicate over network loopback port 9000
RUN sed -i 's|listen = /run/php/php8.4-fpm.sock|listen = 127.0.0.1:9000|' /etc/php/8.4/fpm/pool.d/www.conf
RUN sed -i 's/;clear_env = no/clear_env = no/' /etc/php/8.4/fpm/pool.d/www.conf

# Set up deployment directory, copy source code
WORKDIR /var/www/html
COPY . .

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install vendor dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev --no-scripts

# Create PHP-FPM runtime path
RUN mkdir -p /run/php && chown -R www-data:www-data /run/php

# Nginx
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Start PHP-FPM in background, swap dynamic port, run Nginx in foreground
CMD envsubst '\$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
    /usr/sbin/php-fpm8.4 -D && \
    nginx -g "daemon off;"
