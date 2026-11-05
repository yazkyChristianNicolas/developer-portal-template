// Datos del ambiente público que se muestran en las guías (página "Ambientes") y en
// llms.txt. Se leen de env vars en el build (ver .env.example) para no hardcodear URLs de
// un deployment puntual. Los default marcan explícitamente lo que falta definir.

const PENDING = 'a definir';

export interface PortalEnvironment {
  /** URL pública de este portal (sin barra final). */
  siteUrl: string;
  /** URL base de la API que documenta este deployment. */
  apiUrl: string;
  /** Token endpoint OAuth 2.0 (grant client_credentials). */
  tokenUrl: string;
  /** URL de la consola donde el integrador crea sus API keys y clientes. */
  consoleUrl: string;
  /** Endpoint del servidor MCP para agentes de IA (termina en /mcp). */
  mcpUrl: string;
  /** Ambiente al que apunta la API de este deployment: `sandbox` o `production`. Decide si
   * se muestran los datos de prueba (ver SandboxOnly). */
  mode: string;
}

/** Una env var vacía cuenta como no definida: Actions y `docker build --build-arg` pasan
 * string vacío cuando la variable no existe. */
function env(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export const environment: PortalEnvironment = {
  siteUrl: env('PORTAL_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  apiUrl: env('PORTAL_API_URL', PENDING),
  tokenUrl: env('PORTAL_TOKEN_URL', PENDING),
  consoleUrl: env('PORTAL_CONSOLE_URL', PENDING),
  mcpUrl: env('PORTAL_MCP_URL', PENDING),
  mode: env('PORTAL_MODE', PENDING),
};
