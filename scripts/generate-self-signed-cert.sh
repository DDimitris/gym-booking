#!/usr/bin/env bash
set -euo pipefail

# Generates a self-signed certificate for local development.
# Output: certs/fullchain.pem (public cert), certs/privkey.pem (private key)
# Default CN=localhost unless DOMAIN env var provided.

DOMAIN=${DOMAIN:-localhost}
CERT_DIR="certs"
mkdir -p "$CERT_DIR"

echo "Generating self-signed certificate for $DOMAIN..."
openssl req -x509 -nodes -newkey rsa:4096 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" -days 365 \
  -addext "subjectAltName=DNS:$DOMAIN,IP:127.0.0.1" \
  -sha256

chmod 600 "$CERT_DIR/privkey.pem"
echo "Done. Files written: $CERT_DIR/fullchain.pem, $CERT_DIR/privkey.pem"