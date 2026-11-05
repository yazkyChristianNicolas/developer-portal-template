/**
 * Falla si la documentación pública menciona tecnología interna: la infraestructura
 * (servidor de autenticación, almacén de secretos, base de datos, broker), proveedores
 * de terceros o referencias al código (clases, archivos del repo). Al integrador solo le
 * importa el contrato HTTP; nombrar la implementación lo expone sin darle nada útil.
 *
 * Revisa las guías (docs/), los componentes (src/) y el spec (apis/), que es por donde
 * se cuelan los textos del servicio: descripciones de Swagger y mensajes de error.
 * Corre como primer paso de `npm run build`. Si salta por un texto del spec, el arreglo
 * va en el servicio, no acá.
 *
 * Personalizalo: agregá a FORBIDDEN los términos de tu stack (nombre de la base de datos,
 * del IdP, de proveedores) y a ALLOWED las frases literales que sí se pueden citar.
 *
 * Uso: node scripts/check-public-terms.mts
 */
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const TARGETS = ['docs', 'src', 'apis'];

const FORBIDDEN: {pattern: RegExp; why: string}[] = [
  {pattern: /\bKeycloak\b|\bAuth0\b|\bCognito\b/gi, why: 'servidor de autenticación'},
  {pattern: /\bVault\b|\bSecrets? Manager\b/gi, why: 'almacén de secretos'},
  {pattern: /\bPrisma\b|\bPostgre(s|SQL)\b|\bMongoDB\b|\bRedis\b/gi, why: 'base de datos'},
  {pattern: /\bKafka\b|\bRabbitMQ\b|\bSQS\b/gi, why: 'broker de mensajes'},
  {pattern: /AGENTS\.md|resources\/[\w-]+\.md/g, why: 'archivo interno del repo'},
  {pattern: /\bApiError\.\w+|\b[A-Z]\w+(Service|Controller|Repository|Mapper)\b/g, why: 'clase interna del servicio'},
];

// Frases literales que sí se pueden nombrar (se quitan antes de buscar).
const ALLOWED: string[] = [];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const problems: string[] = [];
for (const file of TARGETS.flatMap((target) => files(join(ROOT, target)))) {
  let content = readFileSync(file, 'utf8');
  for (const allowed of ALLOWED) content = content.replaceAll(allowed, '');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    for (const {pattern, why} of FORBIDDEN) {
      for (const match of line.matchAll(pattern)) {
        const start = Math.max(0, match.index - 50);
        problems.push(
          `${relative(ROOT, file)}:${index + 1}  "${match[0]}" (${why})\n    …${line.slice(start, match.index + match[0].length + 50).trim()}…`,
        );
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`La documentación pública menciona tecnología interna (${problems.length}):\n`);
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Sin referencias a tecnología interna.');
