#!/bin/bash
# First-time SSL certificate setup for api.miushop.io.vn
# Run once on fresh VPS before `docker compose up -d`
set -e

DOMAIN="api.miushop.io.vn"
EMAIL="${SSL_EMAIL:-admin@miushop.io.vn}"
CERT_PATH="./certbot-conf/conf/live/$DOMAIN"

echo "==> Checking for existing certificate..."
if [ -d "$CERT_PATH" ]; then
  echo "Certificate already exists. Skipping."
  exit 0
fi

echo "==> Creating dummy certificate for nginx to start..."
mkdir -p ./certbot-conf/conf/live/$DOMAIN
docker compose run --rm --entrypoint \
  "openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
   -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
   -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
   -subj '/CN=localhost'" certbot

echo "==> Starting nginx with dummy cert..."
docker compose up -d nginx

echo "==> Deleting dummy certificate..."
docker compose run --rm --entrypoint \
  "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "==> Requesting real certificate from Let's Encrypt..."
docker compose run --rm --entrypoint \
  "certbot certonly --webroot -w /var/www/certbot \
   --email $EMAIL --agree-tos --no-eff-email \
   -d $DOMAIN" certbot

echo "==> Reloading nginx..."
docker compose exec nginx nginx -s reload

echo "✅ SSL certificate issued for $DOMAIN"
