import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

interface Card {
  title: string;
  description: string;
  to: string;
}

const CARDS: Card[] = [
  {
    title: 'Primeros pasos',
    description: 'De cero a tu primer pedido creado en minutos.',
    to: '/docs/primeros-pasos',
  },
  {
    title: 'Referencia de la API',
    description: 'Todos los endpoints, con schemas, ejemplos y errores posibles.',
    to: '/api/',
  },
  {
    title: 'Webhooks',
    description: 'Recibí eventos en tiempo real y verificá su firma.',
    to: '/docs/guias/webhooks',
  },
  {
    title: 'Recursos para IA',
    description: 'llms.txt, llms-full.txt y el spec OpenAPI para tu asistente de código.',
    to: '/docs/recursos-para-ia',
  },
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title="Inicio" description={siteConfig.tagline}>
      <header className={styles.hero}>
        <div className="container">
          <p className={styles.eyebrow}>API para developers</p>
          <Heading as="h1" className={styles.title}>
            Integrá pedidos en minutos, no en semanas.
          </Heading>
          <p className={styles.subtitle}>
            Una API REST con JSON, errores estables y documentación pensada para personas y para
            asistentes de IA.
          </p>
          <div className={styles.buttons}>
            <Link className={styles.primaryButton} to="/docs/primeros-pasos">
              Empezar
            </Link>
            <Link className={styles.secondaryButton} to="/api/">
              Ver la referencia
            </Link>
          </div>
          <pre className={styles.snippet}>
            <span className={styles.snippetMuted}>$ </span>curl -X POST "$API_URL/orders" \{'\n'}
            {'    '}-H "Authorization: Bearer $TOKEN" \{'\n'}
            {'    '}-d {"'"}{'{ "customer_id": "cus_01HZX", "currency": "ARS", "items": [ … ] }'}{"'"}
            {'\n\n'}
            <span className={styles.snippetMuted}>→ 201 </span>
            {'{ "id": "ord_01HZZ", "status": '}
            <span className={styles.snippetAccent}>"PENDING"</span>
            {', "total_amount": 24200 }'}
          </pre>
        </div>
      </header>
      <main className={`container ${styles.cards}`}>
        <div className="row">
          {CARDS.map((card) => (
            <div key={card.to} className="col col--3 margin-bottom--lg">
              <Link to={card.to} className={styles.card}>
                <Heading as="h3">{card.title}</Heading>
                <p>{card.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
