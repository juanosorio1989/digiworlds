// Post-build checks on dist/. Run via `npm run check` or `node scripts/check-dist.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/config/site.ts';
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
  for (const s of switches) if (s.href !== want) err(`lang switch href is ${s.href}, expected ${want}`);

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

  if (html.includes('class="placeholder"') || html.includes('class=placeholder')) {
    warnings.push(`${where}: contains an unfilled placeholder (class="placeholder")`);
  }
}

export function checkDist(distDir = 'dist') {
  const errors = [];
  const warnings = [];
  for (const key of pageKeys) {
    for (const lang of langs) {
      const file = join(distDir, distFileFor(routes[key][lang]));
      if (!existsSync(file)) continue;
      checkPage(readFileSync(file, 'utf8'), key, lang, errors, warnings);
    }
  }
  if (!existsSync(join(distDir, distFileFor('/')))) errors.push('dist/index.html is missing');
  return { errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings } = checkDist(process.argv[2] ?? 'dist');
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  if (errors.length) process.exit(1);
  console.log(`check-dist: ok (${warnings.length} warning(s))`);
}
