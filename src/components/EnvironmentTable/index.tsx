import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {PortalEnvironment} from '@site/portal.environment.mts';

export default function EnvironmentTable(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const environment = siteConfig.customFields!.environment as PortalEnvironment;
  const rows: [string, string, string][] = [
    ['URL base de la API', environment.apiUrl, 'API_URL'],
    ['Token endpoint (API Clients)', environment.tokenUrl, 'TOKEN_URL'],
    ['Consola', environment.consoleUrl, ''],
    ['Servidor MCP (agentes de IA)', environment.mcpUrl, 'MCP_URL'],
  ];
  return (
    <table>
      <thead>
        <tr>
          <th>Qué</th>
          <th>Valor</th>
          <th>Variable en los ejemplos</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value, variable]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>
              <code>{value}</code>
            </td>
            <td>{variable && <code>${variable}</code>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
