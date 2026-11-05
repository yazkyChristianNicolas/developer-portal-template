# Portal de developers: sitio estático (Docusaurus + Redoc) servido por nginx.
#
# Una sola imagen para todos los ambientes: se buildea con placeholders en lugar de las
# URLs públicas y docker/40-portal-config.sh los reemplaza al arrancar el contenedor con
# las env vars del ambiente. Así la misma imagen que se probó en desarrollo es la que se
# promueve a producción.
#
#   docker build -t developer-portal .
#   docker run -p 8080:80 \
#     -e PORTAL_SITE_URL=https://developers.ejemplo.com \
#     -e PORTAL_API_URL=https://api.ejemplo.com \
#     -e PORTAL_TOKEN_URL=https://auth.ejemplo.com/oauth/token \
#     -e PORTAL_CONSOLE_URL=https://console.ejemplo.com \
#     -e PORTAL_MCP_URL=https://mcp.ejemplo.com/mcp \
#     -e PORTAL_MODE=sandbox \
#     developer-portal
#
# PORTAL_SITE_URL es obligatoria; las demás, si faltan, se muestran como "a definir".

FROM node:24-alpine AS build
WORKDIR /app

# Placeholders que reemplaza docker/40-portal-config.sh. PORTAL_SITE_URL tiene que ser una
# URL válida porque Docusaurus la valida en el build.
ENV PORTAL_SITE_URL=https://portal-site-url.invalid \
    PORTAL_API_URL=__PORTAL_API_URL__ \
    PORTAL_TOKEN_URL=__PORTAL_TOKEN_URL__ \
    PORTAL_CONSOLE_URL=__PORTAL_CONSOLE_URL__ \
    PORTAL_MCP_URL=__PORTAL_MCP_URL__ \
    PORTAL_MODE=__PORTAL_MODE__

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-portal-config.sh /docker-entrypoint.d/40-portal-config.sh
COPY --from=build /app/build /usr/share/portal
EXPOSE 80
