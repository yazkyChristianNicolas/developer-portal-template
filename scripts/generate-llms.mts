/**
 * Genera, dentro de build/, los recursos para asistentes de IA (ver docs/recursos-para-ia.md):
 *
 *   build/llms.txt               índice en formato llmstxt.org
 *   build/llms-full.txt          todas las guías + la referencia de la API, en un solo Markdown
 *   build/docs/<página>.md       copia en Markdown de cada página de docs/
 *   build/api/reference.md       la referencia de la API en Markdown, generada del spec
 *
 * Corre después de `docusaurus build` (ver el script "build" de package.json). Lee las
 * mismas fuentes que el sitio: docs/ (ordenado igual que el sidebar autogenerado) y el spec
 * bundleado en static/openapi/, así que nunca se desincroniza del portal.
 *
 * Uso: node scripts/generate-llms.mts   (Node >= 22.18 ejecuta TypeScript sin compilar)
 */
import {mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {environment} from '../portal.environment.mts';

const ROOT = join(import.meta.dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const BUILD_DIR = join(ROOT, 'build');
const SPEC_PATH = join(ROOT, 'static/openapi/acme.json');
const SITE = environment.siteUrl;

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------

interface Doc {
  /** Ruta relativa a docs/, sin extensión (ej. "guias/emitir-factura"). */
  id: string;
  title: string;
  description: string;
  category: string | null;
  body: string;
}

function parseFrontmatter(source: string): {data: Record<string, string>; body: string} {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) return {data: {}, body: source};
  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return {data, body: source.slice(match[0].length)};
}

function readCategory(dir: string): {label: string; position: number} | null {
  try {
    return JSON.parse(readFileSync(join(dir, '_category_.json'), 'utf8'));
  } catch {
    return null;
  }
}

/** Mismo orden que el sidebar autogenerado: `sidebar_position` de cada página y
 * `position` de cada _category_.json, mezclados en el mismo nivel. */
function collectDocs(dir: string, category: string | null): Doc[] {
  const entries: {position: number; docs: Doc[]}[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      const meta = readCategory(path);
      entries.push({
        position: meta?.position ?? Number.MAX_SAFE_INTEGER,
        docs: collectDocs(path, meta?.label ?? name),
      });
    } else if (/\.mdx?$/.test(name)) {
      const {data, body} = parseFrontmatter(readFileSync(path, 'utf8'));
      entries.push({
        position: Number(data.sidebar_position ?? Number.MAX_SAFE_INTEGER),
        docs: [
          {
            id: relative(DOCS_DIR, path).replace(/\.mdx?$/, ''),
            title: data.title ?? name,
            description: data.description ?? '',
            category,
            body,
          },
        ],
      });
    }
  }
  return entries.sort((a, b) => a.position - b.position).flatMap((entry) => entry.docs);
}

function markdownUrl(docId: string): string {
  return `${SITE}/docs/${docId}.md`;
}

/** Deja el cuerpo de una página MDX como Markdown plano, legible fuera del sitio. */
function toPlainMarkdown(doc: Doc, spec: OpenApi): string {
  const docDir = dirname(doc.id);
  return (
    doc.body
      // imports de MDX
      .replace(/^import .*$\n/gm, '')
      // componentes propios -> su contenido en Markdown
      .replace(/<EnvironmentTable\s*\/>/g, environmentTable())
      .replace(/<ErrorCatalog\s*\/>/g, errorCatalogTable(spec))
      // datos de prueba: el contenido queda, con la aclaración del ambiente
      .replace(
        /<SandboxOnly>\n?/g,
        '> Solo para el ambiente sandbox: en producción estos datos no sirven.\n\n',
      )
      .replace(/\n?<\/SandboxOnly>/g, '')
      // admonitions de Docusaurus (:::tip Título) -> blockquote
      .replace(/^:::(\w+)(?: (.*))?\n([\s\S]*?)\n:::$/gm, (_m, _type, title, content) =>
        [title ? `**${title}**` : '', content]
          .filter(Boolean)
          .join('\n\n')
          .split('\n')
          .map((line: string) => (line ? `> ${line}` : '>'))
          .join('\n'),
      )
      // links internos
      .replace(/\]\(pathname:\/\/\//g, `](${SITE}/`)
      .replace(/\]\((\.{1,2}\/[^)#]+?)\.mdx?(#[^)]*)?\)/g, (_m, target, anchor = '') => {
        const id = join(docDir, target).replace(/^\.\//, '');
        return `](${markdownUrl(id)}${anchor})`;
      })
      .trim()
  );
}

function environmentTable(): string {
  return table(
    ['Qué', 'Valor', 'Variable en los ejemplos'],
    [
      ['URL base de la API', code(environment.apiUrl), code('$API_URL')],
      ['Token endpoint (API Clients)', code(environment.tokenUrl), code('$TOKEN_URL')],
      ['Consola', code(environment.consoleUrl), ''],
      ['Servidor MCP (agentes de IA)', code(environment.mcpUrl), code('$MCP_URL')],
    ],
  );
}

function errorCatalogTable(spec: OpenApi): string {
  const media = spec.paths['/errors'].get!.responses['200'].content!['application/json'];
  const entries = [...(media.example as ErrorCatalogEntry[])].sort((a, b) => a.code - b.code);
  return table(
    ['code', 'Status', 'Nombre', 'Ejemplo de detail'],
    entries.map((e) => [code(String(e.code)), String(e.status), code(e.name), e.example_detail]),
  );
}

// ---------------------------------------------------------------------------
// Referencia de la API (OpenAPI -> Markdown)
// ---------------------------------------------------------------------------

type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  enum?: unknown[];
  nullable?: boolean;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: unknown;
};

interface MediaType {
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, {summary?: string; value: unknown}>;
}

interface Operation {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Record<string, string[]>[];
  parameters?: {name: string; in: string; required?: boolean; description?: string; schema?: Schema}[];
  requestBody?: {content: Record<string, MediaType>};
  responses: Record<string, {description?: string; content?: Record<string, MediaType>}>;
}

interface OpenApi {
  info: {title: string; description?: string; version: string};
  tags?: {name: string; description?: string}[];
  'x-tagGroups'?: {name: string; tags: string[]}[];
  paths: Record<string, Record<string, Operation>>;
  components: {schemas: Record<string, Schema>};
}

interface ErrorCatalogEntry {
  name: string;
  status: number;
  code: number;
  example_detail: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const MAX_SCHEMA_DEPTH = 4;

function resolve(spec: OpenApi, schema: Schema): Schema {
  if (schema.$ref) {
    return resolve(spec, spec.components.schemas[schema.$ref.split('/').pop()!]);
  }
  // Los generadores de OpenAPI modelan un objeto anidado nullable como `nullable + allOf: [$ref]`.
  if (schema.allOf?.length === 1) {
    const {allOf, ...rest} = schema;
    return {...resolve(spec, allOf[0]), ...rest, type: resolve(spec, allOf[0]).type};
  }
  return schema;
}

function typeLabel(spec: OpenApi, raw: Schema): string {
  const schema = resolve(spec, raw);
  let label: string;
  if (schema.enum) label = schema.enum.map((v) => String(v)).join(' \\| ');
  else if (schema.oneOf) label = schema.oneOf.map((s) => typeLabel(spec, s)).join(' \\| ');
  else if (schema.type === 'array' && schema.items) label = `${typeLabel(spec, schema.items)}[]`;
  else label = schema.format ? `${schema.type} (${schema.format})` : (schema.type ?? 'object');
  return schema.nullable ? `${label} \\| null` : label;
}

function constraints(schema: Schema): string {
  const parts: string[] = [];
  if (schema.minimum !== undefined) parts.push(`mín. ${schema.minimum}`);
  if (schema.maximum !== undefined) parts.push(`máx. ${schema.maximum}`);
  if (schema.pattern) parts.push(`patrón \`${schema.pattern}\``);
  if (schema.default !== undefined) parts.push(`default \`${JSON.stringify(schema.default)}\``);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

/** Aplana un schema de objeto a filas "campo.anidado[] | tipo | obligatorio | descripción". */
function schemaRows(spec: OpenApi, raw: Schema, prefix = '', depth = 0): string[][] {
  const schema = resolve(spec, raw);
  const target = schema.type === 'array' && schema.items ? resolve(spec, schema.items) : schema;
  if (!target.properties || depth > MAX_SCHEMA_DEPTH) return [];
  const rows: string[][] = [];
  for (const [name, propertyRaw] of Object.entries(target.properties)) {
    const property = resolve(spec, propertyRaw);
    const path = `${prefix}${name}`;
    rows.push([
      code(path),
      typeLabel(spec, propertyRaw),
      target.required?.includes(name) ? 'sí' : 'no',
      oneLine((property.description ?? '') + constraints(property)),
    ]);
    const isArray = property.type === 'array';
    const nested = isArray && property.items ? resolve(spec, property.items) : property;
    if (nested.properties) {
      rows.push(...schemaRows(spec, nested, `${path}${isArray ? '[]' : ''}.`, depth + 1));
    }
  }
  return rows;
}

function firstExample(media: MediaType | undefined): {summary?: string; value: unknown} | null {
  if (!media) return null;
  if (media.example !== undefined) return {value: media.example};
  const first = Object.values(media.examples ?? {})[0];
  return first ?? null;
}

function authLabel(operation: Operation): string {
  const schemes = (operation.security ?? []).flatMap((requirement) => Object.keys(requirement));
  if (schemes.length === 0) return 'Sin autenticación.';
  const names: Record<string, string> = {
    'user-session': 'sesión de usuario (JWT)',
    'api-client': 'API Client (client_credentials)',
  };
  return `Bearer token: ${schemes.map((s) => names[s] ?? s).join(' o ')}.`;
}

function operationMarkdown(spec: OpenApi, method: string, path: string, operation: Operation): string {
  const out: string[] = [`### ${method.toUpperCase()} ${path}`, ''];
  if (operation.summary) out.push(`**${oneLine(operation.summary)}**`, '');
  if (operation.description) out.push(operation.description.trim(), '');
  out.push(`**Auth:** ${authLabel(operation)}`, '');

  if (operation.parameters?.length) {
    out.push(
      '**Parámetros:**',
      '',
      table(
        ['Nombre', 'En', 'Tipo', 'Obligatorio', 'Descripción'],
        operation.parameters.map((p) => [
          code(p.name),
          p.in,
          p.schema ? typeLabel(spec, p.schema) : '',
          p.required ? 'sí' : 'no',
          oneLine((p.description ?? '') + (p.schema ? constraints(resolve(spec, p.schema)) : '')),
        ]),
      ),
      '',
    );
  }

  const body = operation.requestBody?.content?.['application/json'];
  if (body?.schema) {
    const rows = schemaRows(spec, body.schema);
    if (rows.length) {
      out.push('**Body (JSON):**', '', table(['Campo', 'Tipo', 'Obligatorio', 'Descripción'], rows), '');
    }
    for (const [name, example] of Object.entries(body.examples ?? {})) {
      out.push(`Ejemplo de body — ${example.summary ?? name}:`, '', jsonBlock(example.value), '');
    }
    if (body.example !== undefined) out.push('Ejemplo de body:', '', jsonBlock(body.example), '');
  }

  const errors: string[][] = [];
  for (const [status, response] of Object.entries(operation.responses)) {
    const json = response.content?.['application/json'];
    if (Number(status) < 400) {
      out.push(`**Respuesta ${status}**${response.description ? `: ${oneLine(response.description)}` : ''}`, '');
      const example = firstExample(json);
      // El ejemplo de GET /errors es el catálogo completo: ya está en su propia sección.
      if (example && path !== '/errors') {
        out.push(jsonBlock(example.value), '');
      }
      continue;
    }
    const problem = response.content?.['application/problem+json'];
    const examples = Object.values(problem?.examples ?? {});
    if (examples.length === 0) errors.push([status, '', oneLine(response.description ?? '')]);
    for (const example of examples) {
      const value = example.value as {code?: number; detail?: string};
      errors.push([status, value.code ? code(String(value.code)) : '', oneLine(example.summary ?? value.detail ?? '')]);
    }
  }
  if (errors.length) out.push('**Errores:**', '', table(['Status', 'code', 'Cuándo'], errors), '');
  return out.join('\n');
}

function apiReference(spec: OpenApi): string {
  const operationsByTag = new Map<string, string[]>();
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) continue;
      const tag = operation.tags?.[0] ?? 'otros';
      operationsByTag.set(tag, [...(operationsByTag.get(tag) ?? []), operationMarkdown(spec, method, path, operation)]);
    }
  }
  const tagDescriptions = new Map((spec.tags ?? []).map((t) => [t.name, t.description ?? '']));
  const groups = spec['x-tagGroups'] ?? [{name: 'Endpoints', tags: [...operationsByTag.keys()]}];

  const out: string[] = [
    `# Referencia de la API — ${spec.info.title} ${spec.info.version}`,
    '',
    spec.info.description ?? '',
    '',
    `Wire format: JSON en snake_case, montos enteros en centavos, fechas ISO 8601. Errores en ` +
      `application/problem+json con un \`code\` numérico estable. Spec OpenAPI: ${SITE}/openapi/acme.json`,
    '',
  ];
  for (const group of groups) {
    out.push(`# ${group.name}`, '');
    for (const tag of group.tags) {
      const operations = operationsByTag.get(tag);
      if (!operations) continue;
      out.push(`## ${tag}`, '', tagDescriptions.get(tag) ?? '', '', ...operations);
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------------------------------------------------------------------------
// Helpers de Markdown
// ---------------------------------------------------------------------------

function code(value: string): string {
  return `\`${value}\``;
}

function oneLine(value: string): string {
  return value.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function jsonBlock(value: unknown): string {
  return ['```json', JSON.stringify(value, null, 2), '```'].join('\n');
}

function write(path: string, content: string): void {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, content.trimEnd() + '\n');
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main(): void {
  const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8')) as OpenApi;
  const docs = collectDocs(DOCS_DIR, null);
  const reference = apiReference(spec);

  const pages = docs.map((doc) => ({doc, markdown: toPlainMarkdown(doc, spec)}));
  for (const {doc, markdown} of pages) {
    write(join(BUILD_DIR, 'docs', `${doc.id}.md`), markdown);
  }
  write(join(BUILD_DIR, 'api', 'reference.md'), reference);

  const intro = [
    '# Acme Developers',
    '',
    '> API REST para gestionar pedidos, clientes y productos, con webhooks firmados y servidor MCP para agentes de IA.',
    '',
    'Convenciones clave: JSON en snake_case; montos enteros en centavos; fechas ISO 8601; ' +
      'autenticación con `Authorization: Bearer <JWT>` (sesión de usuario o API Client con ' +
      'client_credentials); errores RFC 7807 con un `code` numérico estable.',
  ];

  const sections = new Map<string, string[]>();
  for (const {doc} of pages) {
    const section = doc.category ?? 'Empezar';
    const line = `- [${doc.title}](${markdownUrl(doc.id)})${doc.description ? `: ${doc.description}` : ''}`;
    sections.set(section, [...(sections.get(section) ?? []), line]);
  }
  const llms = [
    ...intro,
    '',
    ...[...sections].flatMap(([section, lines]) => [`## ${section}`, '', ...lines, '']),
    '## Referencia de la API',
    '',
    `- [Referencia completa en Markdown](${SITE}/api/reference.md): todos los endpoints, parámetros, bodies, ejemplos y errores.`,
    `- [OpenAPI 3.0 (JSON)](${SITE}/openapi/acme.json): el spec, para generar clientes tipados.`,
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${SITE}/llms-full.txt): todas las guías y la referencia de la API en un solo archivo.`,
  ].join('\n');
  write(join(BUILD_DIR, 'llms.txt'), llms);

  const full = [
    ...intro,
    '',
    ...pages.map(({doc, markdown}) => `<!-- ${markdownUrl(doc.id)} -->\n\n${markdown}`),
    reference,
  ].join('\n\n---\n\n');
  write(join(BUILD_DIR, 'llms-full.txt'), full);

  console.log(
    `llms: ${pages.length} páginas + referencia (${Object.keys(spec.paths).length} paths) -> ` +
      `llms.txt, llms-full.txt (${Math.round(Buffer.byteLength(full) / 1024)} KB)`,
  );
}

main();
