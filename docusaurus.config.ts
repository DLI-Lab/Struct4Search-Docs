import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';

const config: Config = {
  title: 'Struct4Search',
  tagline: '멀티모달 문서 지식화와 근거 기반 검색을 위한 개발자 문서',
  url: 'https://dli-lab.github.io',
  baseUrl: '/Struct4Search-Docs/',
  trailingSlash: false,
  organizationName: 'DLI-Lab',
  projectName: 'Struct4Search-Docs',
  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {onBrokenMarkdownLinks: 'warn'},
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@getcanary/docusaurus-theme-search-pagefind',
      {
        includeRoutes: ['docs/**'],
        maxPages: 8,
        maxSubResults: 3,
        _base: '/Struct4Search-Docs',
        _replace: '/Struct4Search-Docs/Struct4Search-Docs',
      },
    ],
  ],
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/DLI-Lab/Struct4Search-Docs/tree/main/',
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Struct4Search',
      items: [
        {type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Documentation'},
        {href: 'https://github.com/DLI-Lab/Struct4Search-Docs', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [{label: 'Overview', to: '/docs/overview'}],
        },
        {
          title: 'Project',
          items: [{label: 'GitHub', href: 'https://github.com/DLI-Lab/Struct4Search-Docs'}],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Struct4Search contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
