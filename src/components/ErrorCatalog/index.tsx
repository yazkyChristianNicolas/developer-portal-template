import type {ReactNode} from 'react';
import spec from '@site/static/openapi/acme.json';

interface ErrorCatalogEntry {
  name: string;
  status: number;
  code: number;
  example_detail: string;
}

// El catálogo viene embebido en el spec como ejemplo de GET /errors (lo exporta el
// servicio), así esta tabla nunca se desincroniza de la API.
const entries = (
  spec.paths['/errors'].get.responses['200'].content['application/json'] as unknown as {
    example: ErrorCatalogEntry[];
  }
).example;

export default function ErrorCatalog(): ReactNode {
  const sorted = [...entries].sort((a, b) => a.code - b.code);
  return (
    <table>
      <thead>
        <tr>
          <th>code</th>
          <th>Status</th>
          <th>Nombre</th>
          <th>Ejemplo de detail</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry) => (
          <tr key={entry.code} id={String(entry.code)}>
            <td>
              <code>{entry.code}</code>
            </td>
            <td>{entry.status}</td>
            <td>
              <code>{entry.name}</code>
            </td>
            <td>{entry.example_detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
