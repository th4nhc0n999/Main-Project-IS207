FROM php:8.2-apache

# Cài đặt các thư viện hệ thống cần thiết cho Laravel và các extension
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Cấu hình & cài đặt các extension PHP (hỗ trợ MySQL SSL, QR code, JWT, Bcrypt)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip

# Bật Apache mod_rewrite
RUN a2enmod rewrite

# Cài đặt Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Thiết lập thư mục làm việc
WORKDIR /var/www/html

# Copy toàn bộ mã nguồn backend vào container
COPY . /var/www/html

# Chuyển đổi định dạng dòng và cấp quyền thực thi cho entrypoint script
RUN sed -i -e 's/\r$//' /var/www/html/docker-entrypoint.sh \
    && cp /var/www/html/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Cài đặt dependencies PHP tối ưu cho production
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Phân quyền cho storage và bootstrap/cache
RUN mkdir -p /var/www/html/storage/framework/cache \
             /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]

