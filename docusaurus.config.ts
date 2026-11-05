import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as Redocusaurus from 'redocusaurus';
import {environment} from './portal.environment.mts';

// Corre en Node.js — nada de APIs del browser acá.

const config: Config = {
  title: 'Acme Developers',
  tagline: 'API REST para gestionar pedidos, clientes y productos, con guías, referencia y recursos para IA.',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: environment.siteUrl,
  baseUrl: '/',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // Tipografías del design system (Google Fonts).
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {
      tagName: 'link',
      attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'},
    },
  ],
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  ],

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  // Lo leen los componentes de las páginas (ver src/components/EnvironmentTable).
  customFields: {environment},

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
    [
      'redocusaurus',
      {
        specs: [
          {
            id: 'acme',
            // Lo genera `npm run api:bundle` a partir de apis/acme/openapi.json.
            spec: 'static/openapi/acme.json',
            route: '/api/',
          },
        ],
        theme: {
          // Acento del design system (--brand-accent-hover). Los fondos y tipografías los
          // hereda de las variables de Infima definidas en src/css/custom.css.
          primaryColor: '#0d9488',
          primaryColorDark: '#2dd4bf',
          theme: {
            rightPanel: {backgroundColor: '#0f172a'},
            codeBlock: {backgroundColor: '#020617'},
            typography: {
              headings: {fontFamily: "'Inter', system-ui, sans-serif"},
            },
          },
          options: {
            hideDownloadButton: false,
            expandResponses: '200,201',
            jsonSamplesExpandLevel: 2,
            sortTagsAlphabetically: false,
          },
        },
      },
    ] satisfies Redocusaurus.PresetEntry,
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['es', 'en'],
        docsRouteBasePath: 'docs',
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    // El modo oscuro es opt-in: el default es claro aunque el sistema esté en oscuro.
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'developers',
      logo: {
        alt: 'Acme',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Guías',
        },
        {to: '/api/', label: 'Referencia de la API', position: 'left'},
        {to: '/docs/recursos-para-ia', label: 'Recursos para IA', position: 'right'},
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Empezar',
          items: [
            {label: 'Primeros pasos', to: '/docs/primeros-pasos'},
            {label: 'Autenticación', to: '/docs/autenticacion'},
            {label: 'Ambientes', to: '/docs/ambientes'},
          ],
        },
        {
          title: 'Referencia',
          items: [
            {label: 'Referencia de la API', to: '/api/'},
            {label: 'Catálogo de errores', to: '/docs/referencia/errores'},
          ],
        },
        {
          title: 'Descargas',
          items: [
            {label: 'OpenAPI (JSON)', href: 'pathname:///openapi/acme.json'},
            {label: 'llms.txt', href: 'pathname:///llms.txt'},
            {label: 'llms-full.txt', href: 'pathname:///llms-full.txt'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Acme`,
    },
    prism: {
      // El código va siempre sobre fondo oscuro, así que el tema es oscuro en los dos
      // modos; el fondo lo pisa src/css/custom.css.
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
