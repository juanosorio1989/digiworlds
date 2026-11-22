import type { APIRoute } from 'astro';
import { absoluteUrl, alternates, langs, pageKeys, pathFor } from '../i18n/routes.ts';

export const GET: APIRoute = () => {
  const urls = pageKeys.flatMap((key) =>
    langs.map((lang) => {
      const links = alternates(key)
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
        .join('\n');
      return `  <url>\n    <loc>${absoluteUrl(pathFor(key, lang))}</loc>\n${links}\n  </url>`;
    }),
  );
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
