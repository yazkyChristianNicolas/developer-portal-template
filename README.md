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

## Migrar un portal existente a este formato

Prompt para pegar en Claude Code, dentro del repo de un developers portal existente. Antes de usarlo, completá al principio: cómo se despliega hoy el portal (registry, servidor, hosting estático o contenedor), de dónde sale el spec (URL o repo) y si hay un servidor MCP.

````markdown
Quiero migrar este developers portal existente al formato de la plantilla
https://github.com/yazkyChristianNicolas/developer-portal-template
(clonala en un directorio temporal fuera de este repo y usala como referencia).

## Objetivo
Que este portal quede con la misma arquitectura y funcionalidades que la plantilla,
conservando mi marca, mi contenido y mi spec. No inventes contenido: lo que no exista
en el portal actual, dejalo como TODO o preguntámelo.

## Qué conservar (no sobrescribir)
- Nombre de la marca, logos, favicon y textos de la home.
- Mi design system (colores, tipografías, radios). Mapealo a los tokens de
  `src/css/custom.css` de la plantilla, sin hardcodear colores fuera de los tokens.
- Mi spec OpenAPI/Swagger (va en `apis/<nombre>/openapi.json`) y todo el contenido
  de las guías actuales.
- Mis URLs, dominios, nombres de ambientes y configuración de despliegue.

## Qué adoptar de la plantilla
1. **Stack**: Docusaurus + `redocusaurus` (Redoc en `/api/`) + Redocly CLI
   (`redocly.yaml` con `portal/tag-groups` y `redocly/portal-plugin.cjs`) + búsqueda local.
2. **Navbar y footer**: Guías, Referencia de la API, Recursos para IA; footer con
   Empezar / Referencia / Descargas (OpenAPI, llms.txt, llms-full.txt).
3. **Estructura de `docs/`**: introducción, primeros pasos, autenticación, ambientes (.mdx),
   conceptos/convenciones, guías, referencia/errores (.mdx), recursos-para-ia. El sidebar es
   autogenerado desde `sidebar_position` y `_category_.json`. Cada página lleva `title`,
   `description` y `sidebar_position`.
4. **Ambientes en runtime**: `portal.environment.mts`, componentes `EnvironmentTable` y
   `SandboxOnly`, `Dockerfile` con placeholders `__PORTAL_*__`, `docker/40-portal-config.sh`
   y `docker/nginx.conf`. Una sola imagen para todos los ambientes. Ajustá las variables
   `PORTAL_*` a los ambientes que realmente tengo.
5. **Recursos para IA**: `scripts/generate-llms.mts` (llms.txt, llms-full.txt, copias .md y
   referencia en Markdown). Actualizá el título/intro y las conversiones de los componentes
   que use mi contenido. Agregá la guía de agentes MCP solo si tengo un servidor MCP.
6. **Catálogo de errores**: si mi API tiene un catálogo, exponelo como `example` de
   `GET /errors` y usá `ErrorCatalog`. Si no, omití esa página y el componente.
7. **Chequeo de términos internos**: `scripts/check-public-terms.mts`, completando
   `FORBIDDEN` con las tecnologías internas de mi stack.
8. **CI/CD**: los workflows `ci.yml`, `production.yml`, `sync-openapi.yml`,
   `cleanup-images.yml` y la action `deploy`, adaptados a mi repo, mi registry y mi forma
   de despliegue. Flujo `feature/* → development → main`, build una sola vez y promoción
   sin rebuild.
9. **Hygiene**: `.gitignore` (incluidas las carpetas de agentes de IA), `.dockerignore`,
   `.env.example`, `README.md` actualizado.

## Cómo trabajar
1. Primero inspeccioná este repo y la plantilla, y mostrame un plan breve con: qué se
   mantiene, qué se reemplaza, qué se elimina y qué decisiones necesitás de mí. Esperá mi OK.
2. Trabajá en una rama nueva (`chore/migrar-formato-plantilla`), con commits chicos y
   mensajes claros.
3. Migrá el contenido existente a la nueva estructura sin perder información; si
   movés o renombrás páginas, mantené los slugs viejos (o agregá redirects) para no romper
   links externos.
4. Al final corré `npm run build` y arreglá lo que falle (links rotos, lint del spec,
   términos prohibidos). Mostrame el resultado, no lo des por hecho.
5. No hagas push ni abras PR sin que te lo pida.

## Criterio de terminado
- `npm run build` pasa completo.
- Navbar, `/api/`, footer, búsqueda, modo oscuro y `llms.txt` funcionan.
- No quedan referencias a la plantilla ("Acme") ni a tecnologías internas.
- El README explica cómo se configura y despliega este portal.
````
