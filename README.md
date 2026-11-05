# developer-portal

Plantilla de portal de documentación para integradores externos de una API. Sitio estático, hosting propio.

- **Guías**: Docusaurus, en `docs/` (Markdown/MDX).
- **Referencia de la API**: Redoc CE (vía `redocusaurus`), en `/api/`, a partir del OpenAPI del servicio.
- **Lint/bundle del spec**: Redocly CLI (`redocly.yaml`).
- **Recursos para IA**: `llms.txt`, `llms-full.txt`, copia `.md` de cada página y la referencia en Markdown, generados en el build (`scripts/generate-llms.mts`).
- **Ambientes**: URLs y modo (`sandbox`/`production`) configurables en runtime por env vars; la misma imagen Docker sirve para todos.
- **Design system**: todos los tokens están en `src/css/custom.css`.

## Desarrollo

```bash
npm install
npm start          # bundlea el spec y levanta el sitio en http://localhost:3000
npm run build      # lint de términos + lint del spec + bundle + sitio estático + llms.txt, en build/
npm run serve      # sirve build/ para probarlo
```

Node >= 22.18 (el generador de `llms.txt` es TypeScript ejecutado directo por Node).

## Adaptarlo a tu producto

1. **Nombre**: reemplazá `Acme`/`acme` en `docusaurus.config.ts`, `redocly.yaml`, `package.json`, `scripts/generate-llms.mts` (título e intro de `llms.txt`), `src/pages/index.tsx` y `static/img/`.
2. **Spec**: reemplazá `apis/acme/openapi.json` por el de tu servicio (renombrá la carpeta y actualizá `redocly.yaml`, `ErrorCatalog`, `docusaurus.config.ts`, `generate-llms.mts` y `nginx.conf`, que apuntan a `acme`). Ajustá los grupos del menú en `redocly.yaml` (`portal/tag-groups`).
   - Si tu API publica un catálogo de errores, mantené `GET /errors` con el catálogo como `example`: `ErrorCatalog` y `llms.txt` lo leen de ahí. Si no, borrá `docs/referencia/errores.mdx`, el componente y su uso en `generate-llms.mts`.
3. **Design system**: editá los tokens de `src/css/custom.css` (colores, radios, sombras), las fuentes en `docusaurus.config.ts` (`stylesheets`), el color de Redoc (`redocusaurus.theme`) y los logos de `static/img/`.
4. **Contenido**: reescribí `docs/`. Cada página lleva `title`, `description` y `sidebar_position`; el sidebar, `llms.txt` y `llms-full.txt` salen de ahí. `description` es lo que ve un asistente de IA en `llms.txt`.
5. **Términos internos**: completá `FORBIDDEN` en `scripts/check-public-terms.mts` con las tecnologías de tu stack que no deben aparecer en la documentación pública.

Evitá componentes JSX en las guías: `generate-llms.mts` solo sabe convertir a Markdown los componentes propios que conoce (`<EnvironmentTable />`, `<ErrorCatalog />`, `<SandboxOnly>`). Si agregás otro, sumá su conversión ahí.

## Variables de entorno

| Variable | Qué |
|---|---|
| `PORTAL_SITE_URL` | URL pública de este portal. Se usa en los links absolutos de `llms.txt`, el sitemap y los canonical. Obligatoria en Docker. |
| `PORTAL_API_URL` | URL base de la API. |
| `PORTAL_TOKEN_URL` | Token endpoint OAuth 2.0. |
| `PORTAL_CONSOLE_URL` | Consola donde el integrador crea sus API Clients. |
| `PORTAL_MCP_URL` | Servidor MCP para agentes de IA. |
| `PORTAL_MODE` | `sandbox` o `production`. Con `sandbox` se muestran los datos de prueba (`<SandboxOnly>`). |

- **En local** se leen al buildear (`portal.environment.mts`, ver `.env.example`). Lo que no se define aparece como "a definir".
- **En la imagen Docker** se leen **al arrancar el contenedor**: la imagen se construye una sola vez con placeholders y `docker/40-portal-config.sh` los reemplaza. Para sumar una variable: `portal.environment.mts`, `Dockerfile` (placeholder), `docker/40-portal-config.sh` y esta tabla.

## Branches y CI/CD (GitHub Actions)

```
feature/*  --PR-->  development  --PR-->  main
   verify          build + deploy dev     promoción a producción (sin rebuild)
```

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `ci.yml` | PRs, push a `development`, a mano | Verify (typecheck + build). En push construye la imagen **una vez** (tag `tree-<árbol de git>`), la publica en GHCR y la despliega en `development`. |
| `production.yml` | Push a `main`, a mano | **No buildea.** Re-etiqueta como `production` la imagen `tree-<árbol de main>` y la despliega. Si no existe, falla. |
| `sync-openapi.yml` | Días hábiles, a mano o `repository_dispatch` `openapi-updated` | Descarga el spec de `OPENAPI_SOURCE_URL` y abre un PR si cambió y pasa los chequeos. |
| `cleanup-images.yml` | Lunes; a mano (dry-run por defecto) | Retención en GHCR: conserva `development`/`production`, las últimas 10 y las de 24 h. |

**Variables/secrets del repo**: `OPENAPI_SOURCE_URL` (variable), `OPENAPI_SOURCE_TOKEN` (secret, opcional).
**De cada environment** (`development`, `production`): variable `DEPLOY_ENABLED=true` para desplegar, `HEALTHCHECK_URL` opcional, y secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. El deploy (`.github/actions/deploy`) escribe `DEVELOPERS_PORTAL_TAG` en el `.env` del compose del servidor y reinicia el servicio `developers-portal` (ajustá `compose-dir` si tu ruta difiere).

## Deploy

```bash
docker build -t developer-portal .
docker run -p 8080:80 \
  -e PORTAL_SITE_URL=https://developers.ejemplo.com \
  -e PORTAL_API_URL=https://api.ejemplo.com \
  -e PORTAL_MODE=sandbox \
  developer-portal
```

Servicio del compose en el servidor:

```yaml
developers-portal:
  image: ghcr.io/<owner>/<repo>:${DEVELOPERS_PORTAL_TAG:-production}
  restart: unless-stopped
  environment:
    PORTAL_SITE_URL: https://developers.ejemplo.com
    PORTAL_API_URL: https://api.ejemplo.com
    PORTAL_MODE: production
    # ...el resto de PORTAL_*
```

`docker/nginx.conf` sirve las copias `.md` como `text/markdown` y `llms*.txt`/el spec con CORS abierto, para que las herramientas de IA los puedan leer desde cualquier origen.
