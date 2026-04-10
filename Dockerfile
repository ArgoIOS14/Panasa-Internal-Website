FROM php:8.2-apache

# Enable required Apache modules
RUN a2enmod rewrite headers

# Install curl extension
RUN apt-get update && apt-get install -y libcurl4-openssl-dev && \
    docker-php-ext-install curl && \
    rm -rf /var/lib/apt/lists/*

# Allow .htaccess overrides
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Make Apache listen on Render's PORT (default 10000)
RUN sed -i 's/Listen 80/Listen ${PORT}/g' /etc/apache2/ports.conf && \
    sed -i 's/:80/:${PORT}/g' /etc/apache2/sites-available/000-default.conf

# Copy prod files to web root
COPY dev/ /var/www/html/

# Block search engine indexing on staging
RUN echo 'Header set X-Robots-Tag "noindex, nofollow"' >> /var/www/html/.htaccess

# Set permissions
RUN chown -R www-data:www-data /var/www/html

ENV PORT=10000
EXPOSE 10000
