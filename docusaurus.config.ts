import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TT Analytics',
  tagline: 'Engineering Intelligence for Tech Tweakers',
  favicon: 'img/favicon.ico',

  url: 'https://tech-tweakers.github.io/',
  baseUrl: '/tt-analytics/',
  trailingSlash: false,

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
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/tt-logo.png',
    navbar: {
      title: 'TT Analytics',
      logo: {
        alt: 'Tech Tweakers',
        src: 'img/tt-logo.png',
      },
      items: [
        {
          href: 'https://github.com/Tech-Tweakers/tt-analytics',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Tech Tweakers Brazil — Engineering Intelligence`,
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
