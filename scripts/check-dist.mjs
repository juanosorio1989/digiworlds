// Post-build checks on dist/. Run via `npm run check` or `node scripts/check-dist.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/config/site.ts';
import { isPlaceholder } from '../src/i18n/t.ts';
import { routes, pageKeys, langs, pathFor, otherLang, absoluteUrl, alternates } from '../src/i18n/routes.ts';

// Build output shape (format: 'file'): / -> index.html, /en -> en.html, /x/y -> x/y.html
export function distFileFor(path) {
  if (path === '/') return 'index.html';
  return path.replace(/^\//, '') + '.html';
}

function parseAttrs(tag) {
  const attrs = {};
  const re = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const inner = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  for (const m of inner.matchAll(re)) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return attrs;
}

function tagsOf(html, name) {
  return [...html.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>`, 'gi'))].map((m) => m[0]);
}

const legalKeys = ['terms', 'refunds', 'privacy'];
const prevailing = { es: 'prevalece la versión en español', en: 'the Spanish version prevails' };
const countH2 = (html) => (html.match(/<h2[\s>]/gi) ?? []).length;

function checkPage(html, key, lang, errors, warnings) {
  const path = pathFor(key, lang);
  const where = `${lang}:${key} (${path})`;
  const err = (msg) => errors.push(`${where}: ${msg}`);

  const htmlTag = tagsOf(html, 'html')[0];
  if (!htmlTag || parseAttrs(htmlTag).lang !== lang) err(`<html lang> is not "${lang}"`);

  const links = tagsOf(html, 'link').map(parseAttrs);
  const canon = links.filter((a) => a.rel === 'canonical');
  if (canon.length !== 1) err(`expected 1 canonical, found ${canon.length}`);
  else if (canon[0].href !== absoluteUrl(path)) err(`canonical is ${canon[0].href}, expected ${absoluteUrl(path)}`);

  const alts = links.filter((a) => a.rel === 'alternate' && a.hreflang);
  const expected = alternates(key);
  if (alts.length !== 3) err(`expected 3 hreflang links, found ${alts.length}`);
  for (const e of expected) {
    if (!alts.some((a) => a.hreflang === e.hreflang && a.href === e.href)) err(`missing hreflang ${e.hreflang} -> ${e.href}`);
  }

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!title || !title[1].trim()) err('empty or missing <title>');
  const desc = tagsOf(html, 'meta').map(parseAttrs).find((a) => a.name === 'description');
  if (!desc || !desc.content?.trim()) err('empty or missing meta description');

  const anchors = tagsOf(html, 'a').map(parseAttrs);
  const switches = anchors.filter((a) => 'data-lang-switch' in a);
  const want = pathFor(key, otherLang(lang));
  if (switches.length !== 2) err(`expected 2 [data-lang-switch] links, found ${switches.length}`);
  for (const s of switches) {
    if (s.href !== want) err(`lang switch href is ${s.href}, expected ${want}`);
    if (s.lang !== otherLang(lang) || s.hreflang !== otherLang(lang)) err(`lang switch needs lang and hreflang "${otherLang(lang)}"`);
  }

  const wantLabel = lang === 'es' ? 'English' : 'Español';
  for (const m of html.matchAll(/<a\s[^>]*data-lang-switch[^>]*>([\s\S]*?)<\/a>/gi)) {
    if (m[1].trim() !== wantLabel) err(`lang switch text is "${m[1].trim()}", expected "${wantLabel}"`);
  }

  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 !== 1) err(`expected 1 <h1>, found ${h1}`);

  const body = (/<body[\s\S]*<\/body>/i.exec(html)?.[0] ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ');
  const leftover = body.match(/\{\w+\}/g);
  if (leftover) err(`unreplaced token(s) in body text: ${[...new Set(leftover)].join(', ')}`);

  const labels = (html.match(/data-launch-label/g) ?? []).length;
  if (site.showLaunchLabel) {
    if (key === 'home' && labels < 1) err('launch flag is on but home has no [data-launch-label]');
  } else if (labels > 0) err(`launch flag is off but page has ${labels} [data-launch-label]`);

  const footer = /<footer[\s\S]*?<\/footer>/i.exec(html)?.[0] ?? '';
  const fa = tagsOf(footer, 'a').map(parseAttrs);
  for (const k of pageKeys) {
    const p = pathFor(k, lang);
    if (!fa.some((a) => a.href === p)) err(`<footer> is missing a link to ${p}`);
  }

  if (key === 'terms') {
    const main = /<main[\s\S]*?<\/main>/i.exec(html)?.[0] ?? '';
    const want = pathFor('refunds', lang);
    if (!tagsOf(main, 'a').map(parseAttrs).some((a) => a.href === want)) err(`<main> is missing a link to ${want}`);
  }

  if (legalKeys.includes(key)) {
    if (!html.includes(prevailing[lang])) err(`missing prevailing-language sentence "${prevailing[lang]}"`);
  }

  if (html.includes('class="placeholder"') || html.includes('class=placeholder')) {
    warnings.push(`${where}: contains an unfilled placeholder (class="placeholder")`);
  }
}

function checkSeoFiles(distDir, errors) {
  const sitemapFile = join(distDir, 'sitemap.xml');
  if (!existsSync(sitemapFile)) errors.push('dist/sitemap.xml is missing');
  else {
    const xml = readFileSync(sitemapFile, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    const expected = pageKeys.flatMap((k) => langs.map((l) => absoluteUrl(pathFor(k, l))));
    if (locs.length !== expected.length) errors.push(`sitemap: expected ${expected.length} <loc>, found ${locs.length}`);
    for (const u of expected) if (!locs.includes(u)) errors.push(`sitemap: missing <loc> ${u}`);
    const xl = (xml.match(/<xhtml:link\s/g) ?? []).length;
    if (xl !== expected.length * 3) errors.push(`sitemap: expected ${expected.length * 3} xhtml:link, found ${xl}`);
  }
  const robotsFile = join(distDir, 'robots.txt');
  if (!existsSync(robotsFile)) errors.push('dist/robots.txt is missing');
  else if (!readFileSync(robotsFile, 'utf8').includes(`Sitemap: ${absoluteUrl('/sitemap.xml')}`)) {
    errors.push('robots.txt is missing the Sitemap line');
  }
  for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'og/og-es.png', 'og/og-en.png']) {
    if (!existsSync(join(distDir, f))) errors.push(`dist/${f} is missing`);
  }
}

function checkNotFound(distDir, lang, errors) {
  const rel = lang === 'es' ? '404.html' : 'en/404.html';
  const where = `${lang}:404 (${rel})`;
  const file = join(distDir, rel);
  if (!existsSync(file)) { errors.push(`${where}: ${file} is missing`); return; }
  const html = readFileSync(file, 'utf8');
  const htmlTag = tagsOf(html, 'html')[0];
  if (!htmlTag || parseAttrs(htmlTag).lang !== lang) errors.push(`${where}: <html lang> is not "${lang}"`);
  const robots = tagsOf(html, 'meta').map(parseAttrs).find((a) => a.name === 'robots');
  if (!robots || !robots.content?.includes('noindex')) errors.push(`${where}: missing noindex`);
  if (tagsOf(html, 'link').map(parseAttrs).some((a) => a.rel === 'canonical')) errors.push(`${where}: must not have rel="canonical"`);
  const switches = tagsOf(html, 'a').map(parseAttrs).filter((a) => 'data-lang-switch' in a);
  const want = pathFor('home', otherLang(lang));
  for (const s of switches) {
    if (s.href !== want) errors.push(`${where}: lang switch href is ${s.href}, expected ${want}`);
    if (s.lang !== otherLang(lang) || s.hreflang !== otherLang(lang)) errors.push(`${where}: lang switch needs lang and hreflang "${otherLang(lang)}"`);
  }
  if (switches.length !== 2) errors.push(`${where}: expected 2 [data-lang-switch] links, found ${switches.length}`);
}

export function checkDist(distDir = 'dist') {
  const errors = [];
  const warnings = [];
  for (const k of ['supportEmail', 'operatorName']) {
    if (isPlaceholder(site[k])) warnings.push(`site.${k} is still a placeholder ("${site[k]}")`);
  }
  for (const key of pageKeys) {
    for (const lang of langs) {
      const file = join(distDir, distFileFor(routes[key][lang]));
      if (!existsSync(file)) {
        errors.push(`${lang}:${key}: ${file} is missing`);
        continue;
      }
      checkPage(readFileSync(file, 'utf8'), key, lang, errors, warnings);
    }
  }
  for (const key of legalKeys) {
    const files = langs.map((l) => join(distDir, distFileFor(routes[key][l])));
    if (!files.every((f) => existsSync(f))) continue;
    const [es, en] = files.map((f) => countH2(readFileSync(f, 'utf8')));
    if (es !== en) errors.push(`${key}: <h2> count differs (es ${es}, en ${en})`);
  }
  if (!existsSync(join(distDir, distFileFor('/')))) errors.push('dist/index.html is missing');
  for (const lang of langs) checkNotFound(distDir, lang, errors);
  checkSeoFiles(distDir, errors);
  return { errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings } = checkDist(process.argv[2] ?? 'dist');
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  if (errors.length) process.exit(1);
  console.log(`check-dist: ok (${warnings.length} warning(s))`);
}
