#!/bin/bash
set -e

# Render truyền biến PORT (mặc định 10000 nếu không có)
PORT="${PORT:-80}"

echo ">>> Khoi chay MedSi Backend tren port: ${PORT}..."

# Tao cau hinh VirtualHost cua Apache dong theo PORT cua Render
cat <<EOF > /etc/apache2/sites-available/000-default.conf
<VirtualHost *:${PORT}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/public

    <Directory /var/www/html/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# Cap nhat cong lang nghe cua Apache trong ports.conf
sed -i "s/Listen [0-9]*/Listen ${PORT}/g" /etc/apache2/ports.conf

# Dam bao quyen ghi cho thu muc storage va cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Xoa cache cu de nhan cac bien moi truong thuc te tu Render Dashboard
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Khoi dong scheduler xu ly het han giu cho (chay nen trong container moi phut)
(
    while true; do
        php /var/www/html/artisan schedule:run --no-interaction >> /var/www/html/storage/logs/scheduler.log 2>&1 || true
        sleep 60
    done
) &

echo ">>> Apache san sang tiep nhan request."

# Chay Apache foreground
exec apache2-foreground

