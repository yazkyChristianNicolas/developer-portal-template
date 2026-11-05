#!/bin/sh
# Configuración del portal en runtime: la imagen se buildea una sola vez con placeholders
# (ver Dockerfile) y se promueve tal cual de desarrollo a producción. Al arrancar el
# contenedor, este script copia el sitio desde el template intacto y reemplaza cada
# placeholder por el valor de su env var, en HTML, JS, JSON (índice de búsqueda),
# sitemap, llms.txt y copias .md.
#
# Lo corre el entrypoint de la imagen oficial de nginx (todo script de
# /docker-entrypoint.d/ se ejecuta antes de levantar nginx). Como siempre parte del
# template, es idempotente: recrear el contenedor con otros valores los aplica de cero.
set -eu

TEMPLATE=/usr/share/portal
TARGET=/usr/share/nginx/html
PENDING='a definir'

if [ -z "${PORTAL_SITE_URL:-}" ]; then
  echo "40-portal-config: falta PORTAL_SITE_URL (URL pública del portal)" >&2
  exit 1
fi

# Escapa lo que sed interpreta en el reemplazo (separador |, & y \).
escape() {
  printf '%s' "$1" | sed -e 's/[\\|&]/\\&/g'
}

site_url=$(escape "${PORTAL_SITE_URL%/}")
api_url=$(escape "${PORTAL_API_URL:-$PENDING}")
token_url=$(escape "${PORTAL_TOKEN_URL:-$PENDING}")
console_url=$(escape "${PORTAL_CONSOLE_URL:-$PENDING}")
mcp_url=$(escape "${PORTAL_MCP_URL:-$PENDING}")
mode=$(escape "${PORTAL_MODE:-$PENDING}")

rm -rf "${TARGET:?}"/*
cp -R "$TEMPLATE"/. "$TARGET"/

find "$TARGET" -type f \( -name '*.html' -o -name '*.js' -o -name '*.json' -o -name '*.xml' \
  -o -name '*.txt' -o -name '*.md' \) -exec sed -i \
  -e "s|https://portal-site-url.invalid|$site_url|g" \
  -e "s|__PORTAL_API_URL__|$api_url|g" \
  -e "s|__PORTAL_TOKEN_URL__|$token_url|g" \
  -e "s|__PORTAL_CONSOLE_URL__|$console_url|g" \
  -e "s|__PORTAL_MCP_URL__|$mcp_url|g" \
  -e "s|__PORTAL_MODE__|$mode|g" \
  {} +

echo "40-portal-config: sitio configurado para $PORTAL_SITE_URL"
