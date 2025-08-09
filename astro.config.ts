import path from 'path';
import { fileURLToPath } from 'url';

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import compress from 'astro-compress';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';
import astrowind from './vendor/integration';

import type { AstroIntegration } from 'astro';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = true;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',

  integrations: [
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        return !url.pathname.startsWith('/topics/');
      },
    }),
    mdx(),
    react(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
    pagefind(),
  ],

  image: {
    domains: ['cdn.pixabay.com', 'img-svr.nabiresearch.workers.dev'],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin, remarkMath],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin, rehypeKatex],
  },

  vite: {
    plugins: [tailwind()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      },
    },
  },
});
