FROM php:8.2-apache

# Enable required Apache modules
RUN a2enmod rewrite headers

# Install curl extension
RUN apt-get update && apt-get install -y libcurl4-openssl-dev && \
    docker-php-ext-install curl && \
    rm -rf /var/lib/apt/lists/*

# Configure Apache to allow .htaccess overrides and rewrites
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf && \
    sed -i '/<Directory \/var\/www\/html>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Copy dev files to web root
COPY dev/ /var/www/html/

# Remove www redirect rule (not needed on staging)
RUN sed -i '/Enforce www prefix/,/\[R=301,L\]/d' /var/www/html/.htaccess

# Block search engine indexing on staging
RUN sed -i '1i Header set X-Robots-Tag "noindex, nofollow"' /var/www/html/.htaccess

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Startup script to set Apache port from Render's PORT env
RUN printf '#!/bin/bash\nsed -i "s/Listen 80/Listen ${PORT:-10000}/" /etc/apache2/ports.conf\nsed -i "s/:80/:${PORT:-10000}/" /etc/apache2/sites-available/000-default.conf\napache2-foreground\n' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

EXPOSE 10000
CMD ["/usr/local/bin/start.sh"]
