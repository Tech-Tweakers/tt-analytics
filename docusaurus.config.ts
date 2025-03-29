import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Tech Tweakers - TT Analytics',
  tagline: 'Collabs are cool!',
  favicon: 'img/favicon.ico',

  // 🌐 URL base do site (usado em produção)
  url: 'https://tech-tweakers.github.io/',
  baseUrl: '/tt-analytics/',
  trailingSlash: false,

  // ⚙️ Config de deploy (ajuste pra sua org e repo se necessário)
  organizationName: 'tech-tweakers',
  projectName: 'tt-analytics',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // 🚀 Mostra os docs na raiz (sem /docs na URL)
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/tech-tweakers/tt-analytics/edit/main/',
        },
        blog: false, // ❌ Desativa blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Tech Tweakers - TT Analytics - v1.0',
      logo: {
        alt: 'Tech Tweakers Brazil',
        src: 'img/tt-logo.png',
      },
      items: [],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} Tech Tweakers Brazil. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
