import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {PortalEnvironment} from '@site/portal.environment.mts';
import styles from './styles.module.css';

/**
 * Contenido que solo vale contra el ambiente sandbox (datos de prueba). En el portal de
 * producción se oculta y queda un aviso.
 *
 * La decisión es por CSS sobre `data-mode`, no un `if` en React: la imagen se buildea con
 * el placeholder `__PORTAL_MODE__` y docker/40-portal-config.sh lo reemplaza al arrancar,
 * en el HTML y en el JS por igual. Así el HTML prerenderizado y la hidratación siempre
 * coinciden.
 */
export default function SandboxOnly({children}: {children: ReactNode}): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const environment = siteConfig.customFields!.environment as PortalEnvironment;
  return (
    <div className={styles.root} data-mode={environment.mode}>
      <div className={styles.content}>{children}</div>
      <div className={styles.notice}>
        <p>
          Este portal documenta el ambiente de <strong>producción</strong>: los datos de prueba no
          sirven acá. Usalos en el ambiente sandbox.
        </p>
      </div>
    </div>
  );
}
