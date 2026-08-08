import type { APIRoute } from 'astro';

import { withBase } from '../lib/urls';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase('sitemap-index.xml'), site ?? 'http://localhost:4321');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
