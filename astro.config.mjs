import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import redirects from './src/redirects.json' with { type: 'json' };

const site = 'https://www.begonavalero.com';
const redirectPaths = new Set(Object.keys(redirects).map((p) => new URL(p, site).pathname.replace(/\/?$/, '/')));

export default defineConfig({
  site,
  redirects,
  // La hoja de estilos es pequeña: incrustarla evita una petición que bloquea el pintado.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => !redirectPaths.has(new URL(page).pathname) })],
});
