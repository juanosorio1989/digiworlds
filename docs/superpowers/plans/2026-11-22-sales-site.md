# digiworlds.store Sales Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (ES/EN) static marketing and legal site for digiworlds.store with Astro, ready to deploy on Cloudflare Pages.

**Architecture:** Astro static build. A route map (`src/i18n/routes.ts`) pairs each of 6 page keys with its ES and EN path. All copy lives in `src/i18n/es.json` and `en.json`, and single-source values live in `src/config/site.ts`. 12 thin route files render 6 shared view components through one `Base` layout. A post-build script (`scripts/check-dist.mjs`) verifies the built HTML.

**Tech Stack:** Node 22.23.x, Astro 7.4.13, @astrojs/check 0.9.12, TypeScript (the version @astrojs/check accepts), `node:test` for unit tests, wrangler 4.x (dev-only, for a local Pages preview).

**Spec:** `docs/superpowers/specs/2026-11-21-sales-site-design.md` plus `docs/superpowers/specs/2026-11-21-sales-site-content.md` (copy source). Read both before any task.

## Routing table

Main session: Opus 5.5 (orchestrates, does not implement).

| Task | What | Implementer | Reviewer | Why |
|---|---|---|---|---|
| 1 | Scaffold, config, route map, `t()` with unit tests | implementer-sonnet | reviewer-opus | Fully specified interfaces |
| 2 | Base layout, shared components, CSS, Home (ES/EN), check-dist v1 | implementer-sonnet | reviewer-opus | Specified. Visual choices are the builder's |
| 3 | Pricing and Contact (ES/EN) | implementer-sonnet | reviewer-opus | Same pattern as Task 2 |
| 4 | Terms, Refunds, Privacy (ES/EN) | implementer-sonnet | reviewer-opus | Copy comes from the content file |
| 5 | Sitemap, robots, favicons, OG images, full check-dist | implementer-sonnet | reviewer-opus | Specified |
| 6 | Deploy guide, docs index, local Pages preview | implementer-sonnet | reviewer-opus | Docs from known DNS facts |
| Final | Whole-branch review | — | reviewer-opus | Lab rule |

No task touches money, production data, schemas, auth or secrets, so there is one final review.

## Global Constraints

- Code, file names and comments in English. Page copy only in `src/i18n/*.json`.
- No literal user-facing text in `.astro` files. Everything goes through `t()` / `tHtml()` / `tRaw()`.
- `SUPPORT_EMAIL`-style values only in `src/config/site.ts`. Values: `supportEmail: 'info@digiworlds.store'`, `operatorName: 'OPERATOR_NAME'`, `showLaunchLabel: true`, `appUrl: 'https://app.digiworlds.store'`, `siteUrl: 'https://digiworlds.store'`, `premiumPriceUsd: '9.99'`, `copyrightYear: 2026`, `legalUpdated: '2026-11-22'`.
- No fake testimonials, user counts, ratings, lorem ipsum or template text.
- Spanish at `/`, English under `/en`. No browser-language redirect. Canonical URLs have no trailing slash (except `/`).
- Paths, exactly: home `/` · `/en`; pricing `/precios` · `/en/pricing`; terms `/terminos` · `/en/terms`; refunds `/reembolsos` · `/en/refunds`; privacy `/privacidad` · `/en/privacy`; contact `/contacto` · `/en/contact`.
- Base font 18px, line-height ≥ 1.5, body contrast ≥ 7:1, UI ≥ 4.5:1, visible `:focus-visible` (3px), tap targets ≥ 48×48px, works without JS, respects `prefers-reduced-motion`, no web fonts, no third-party scripts, no ad pixels.
- Spanish prevails. Legal pages carry the prevailing-language line.
- Docs change in the same commit as code. Never create cloud resources. Never touch DNS.

## Review Focus

1. **Language switcher on every page** lands on that page's counterpart, in both directions, never on home. Covered by check-dist (Task 2, extended in Task 5).
2. **A placeholder still unfilled** (`OPERATOR_NAME`) renders inside `<mark class="placeholder">` and the build warns. A filled value renders as plain text. Covered by a unit test in Task 1 and a check-dist warning in Task 2.
3. **Launch flag OFF** removes "Muy pronto" / "Coming soon" from every page in both languages. Covered by the check-dist label count in Task 2 and a manual flip in Task 2 Step 8.
4. **A key missing in one language, or an unknown `{token}`**, fails the build loudly instead of showing a raw key. Covered by unit tests in Task 1.
5. **Long Spanish words and the email at 360px** don't overflow horizontally (`overflow-wrap: anywhere` on text, mailto links included). Covered by a manual 360px check in Task 2 Step 9 and again in Task 4.

---

### Task 1: Scaffold, config, route map, translation helper

**Files:**
- Create: `package.json`, `.nvmrc` (`22.23.5`), `.gitignore` (`node_modules/`, `dist/`, `.astro/`, `.wrangler/`), `astro.config.mjs`, `tsconfig.json`
- Create: `src/config/site.ts`, `src/i18n/routes.ts`, `src/i18n/t.ts`, `src/i18n/es.json`, `src/i18n/en.json` (both start with `{"nav": {...}}` from the Shared UI table)
- Create: `src/pages/index.astro` (temporary, renders `t('es','nav.home')`. Task 2 replaces it)
- Test: `tests/routes.test.ts`, `tests/t.test.ts`

**Interfaces (Produces):**
- `src/config/site.ts`: `export const site = { ...Global Constraints values } as const;`
- `src/i18n/routes.ts`:
  - `export type Lang = 'es' | 'en'`, `export const langs: readonly Lang[] = ['es', 'en']`
  - `export type PageKey = 'home' | 'pricing' | 'terms' | 'refunds' | 'privacy' | 'contact'`
  - `export const pageKeys: readonly PageKey[]` (in that order. Footer order follows it)
  - `export const routes: Record<PageKey, Record<Lang, string>>`
  - `export function pathFor(key: PageKey, lang: Lang): string`
  - `export function otherLang(lang: Lang): Lang`
  - `export function absoluteUrl(path: string): string`, which returns `site.siteUrl + path`, with `/` → `https://digiworlds.store/`
  - `export function alternates(key: PageKey): { hreflang: 'es' | 'en' | 'x-default'; href: string }[]`, which returns es, en and x-default (= es), all absolute
- `src/i18n/t.ts`:
  - `export function t(lang: Lang, key: string, vars?: Record<string, string>): string`: dotted lookup, plain text. Throws `Error('Missing i18n key "<key>" for <lang>')` if the key is missing or not a string. Interpolates `{supportEmail}`, `{operatorName}`, `{price}`, `{appUrl}`, `{date}`, `{year}` from `site` (`date` = `site.legalUpdated`, `year` = `String(site.copyrightYear)`), merged with `vars`. Throws `Error('Unknown token "{x}" in "<key>"')` on any other `{token}`.
  - `export function tHtml(lang: Lang, key: string, vars?: Record<string, string>): string`: same lookup. HTML-escapes the copy, and an interpolated value for which `isPlaceholder()` is true becomes `<mark class="placeholder">VALUE</mark>`.
  - `export function tRaw<T>(lang: Lang, key: string): T`: returns a non-string node (arrays/objects, e.g. legal sections) with every nested string interpolated like `tHtml`.
  - `export function isPlaceholder(value: string): boolean`, true for exactly `'SUPPORT_EMAIL'` or `'OPERATOR_NAME'`.
- JSON imports use `with { type: 'json' }`. TS imports use explicit `.ts` extensions, so `node --test` (native type stripping in Node 22.18+) and Vite both resolve them. Set `"allowImportingTsExtensions": true` and `"noEmit": true` in `tsconfig.json`, extending `astro/tsconfigs/strict`.

- [ ] **Step 1: Init the project.** `npm init -y`, then `npm i astro@7.4.13` and `npm i -D @astrojs/check@0.9.12 typescript wrangler@4`. Set `"type": "module"`, `"engines": {"node": ">=22.23.4"}`, and scripts: `dev: astro dev`, `build: astro build`, `preview: astro preview`, `test: node --test tests/`, `check: astro check && npm test && astro build && node scripts/check-dist.mjs`. Until Task 2 creates the script, `check` stops after build. Add `scripts/check-dist.mjs` as `console.log('check-dist: not yet implemented')`.
- [ ] **Step 2: `astro.config.mjs`**: `site: 'https://digiworlds.store'`, `output: 'static'`, `trailingSlash: 'never'`, `build: { format: 'file' }`.
- [ ] **Step 3: Write failing tests.**
  - `tests/routes.test.ts`:
    - `pathFor('pricing','en') === '/en/pricing'`, `pathFor('home','es') === '/'`, `pathFor('home','en') === '/en'`
    - every key has both langs, and all 12 paths are unique
    - `absoluteUrl('/') === 'https://digiworlds.store/'` and `absoluteUrl('/precios') === 'https://digiworlds.store/precios'`
    - `alternates('terms')` deep-equals es `https://digiworlds.store/terminos`, en `https://digiworlds.store/en/terms`, x-default `https://digiworlds.store/terminos`
  - `tests/t.test.ts`:
    - `t('es','nav.pricing') === 'Precios'` and `t('en','nav.pricing') === 'Pricing'`
    - `t('es','nope')` throws `/Missing i18n key "nope" for es/`
    - **key parity:** a recursive key-path list of `es.json` deep-equals that of `en.json`
    - with a temporary key injected into the imported JSON object in the test, `t` throws `/Unknown token/` on `"{foo}"`
    - `tHtml` escapes `<` to `&lt;`
    - `tHtml` on a string with `{operatorName}` returns `<mark class="placeholder">OPERATOR_NAME</mark>`
    - `tHtml` with `vars: { operatorName: 'Ana' }` returns plain `Ana`
    - `isPlaceholder('info@digiworlds.store') === false`
- [ ] **Step 4:** `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 5:** Implement `site.ts`, `routes.ts`, `t.ts` and the `nav.*` keys in both JSON files.
- [ ] **Step 6:** `npm test`. Expected: all pass.
- [ ] **Step 7: Verify the build output shape.** Temporarily add `src/pages/en/index.astro` and `src/pages/precios.astro` (each rendering one `t()` string), then run `npm run build && find dist -name '*.html' | sort`. Record the actual filenames (expected: `dist/index.html`, `dist/en.html` or `dist/en/index.html`, `dist/precios.html`) at the bottom of this plan under **Build notes**. Task 2's `distFileFor` depends on it. Delete the temp pages.
- [ ] **Step 8:** `npx astro check`. Expected: 0 errors.
- [ ] **Step 9: Commit.** `git add -A && git commit -m "feat: scaffold Astro site with route map and i18n helper"`

### Task 2: Layout, shared components, Home, check-dist v1

**Files:**
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/{Header,Footer,LangSwitch,LaunchLabel,CtaButton,ScreenshotPlaceholder}.astro`, `src/views/Home.astro`
- Create/replace: `src/pages/index.astro`, `src/pages/en/index.astro`
- Modify: `src/i18n/es.json`, `src/i18n/en.json` (keys `switch`, `cta`, `launch`, `skip`, `footer`, `legal.updated`, `home.*`, `meta.home.title`, `meta.home.description`)
- Create: `scripts/check-dist.mjs` (replaces the stub)

**Interfaces:**
- Consumes: everything from Task 1.
- Produces:
  - `Base.astro` props `{ lang: Lang; page: PageKey }`. It renders:
    - `<html lang>`, `<title>` from `t(lang, 'meta.<page>.title')` and meta description from `meta.<page>.description`
    - canonical `absoluteUrl(pathFor(page, lang))` and `<link rel="alternate" hreflang>` × 3 from `alternates(page)`
    - OG tags: `og:title`, `og:description`, `og:url`, `og:image` = `absoluteUrl('/og/og-<lang>.png')`, `og:locale` `es_US`/`en_US`, `og:locale:alternate`
    - favicon links (`/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`; files arrive in Task 5)
    - a skip link to `#main`, `<Header>`, `<main id="main"><slot/></main>`, `<Footer>`
  - `LangSwitch` props `{ lang: Lang; page: PageKey }` → `<a href={pathFor(page, otherLang(lang))} hreflang={other} lang={other} data-lang-switch>` with `t(other, 'switch.label')`. Use it in both the header and the footer.
  - `CtaButton` props `{ lang: Lang }` → `<a href={site.appUrl} class="cta">` + `{site.showLaunchLabel && <LaunchLabel lang/>}`.
  - `LaunchLabel` renders `<span class="launch-label" data-launch-label>`.
  - `Footer`: a nav with links for all 6 `pageKeys` in `lang`, a mailto for `site.supportEmail`, LangSwitch and `t(lang,'footer.copy')`.
  - Views take `{ lang: Lang }` and render inside `<Base lang page>`. Route files are one line, e.g. `<Home lang="es" />`.
  - `scripts/check-dist.mjs` exports `checkDist(distDir = 'dist'): { errors: string[]; warnings: string[] }` and runs as CLI (prints and exits 1 on errors). It also exports `distFileFor(path: string): string`, built from **Build notes**.

- [ ] **Step 1:** Add the Home copy from the content file (Shared UI and Home sections) to both JSON files, plus `meta.home.*`. Keep `npm test` passing (key parity).
- [ ] **Step 2: Write `check-dist.mjs` (v1).** For every route of every key whose built file exists (so it grows as pages are added), assert:
  - `<html lang="<lang>">`
  - exactly one `<link rel="canonical">` equal to `absoluteUrl(path)`
  - 3 hreflang links matching `alternates(key)`
  - non-empty `<title>` and meta description
  - exactly 2 `[data-lang-switch]` links whose href equals the counterpart path
  - one `<h1>`
  - no `{` + identifier + `}` left in body text
  - `[data-launch-label]` count is ≥ 1 on home if `site.showLaunchLabel` is true, and 0 on every page if false
  - footer contains links to all 6 paths of that lang

  It also adds a warning per page containing `class="placeholder"`. Parse with regexes or a tiny manual scan. No new dependency. It imports `routes.ts`/`site.ts` directly (Node type stripping).
- [ ] **Step 3:** `npm run build && node scripts/check-dist.mjs`. Expected: FAIL (home pages not built yet or missing parts).
- [ ] **Step 4:** Implement the CSS, layout, components, `Home.astro` and both home routes, following spec §6 (Home sections) and §8 (accessibility). Palette, wordmark and spacing are your call within the contrast rules. Put colors in CSS custom properties.
- [ ] **Step 5:** `npm run check`. Expected: exit 0. A placeholder warning is printed for any page showing `OPERATOR_NAME` (Home has none, so no warning yet).
- [ ] **Step 6:** `grep -rnE '>[^<{]*[A-Za-zÁÉÍÓÚáéíóúñ]{3,}[^<{]*<' src/components src/views src/layouts`. Expected: no literal copy (only expressions).
- [ ] **Step 7: Commit.** `git commit -am "feat: base layout, shared components and home page in ES/EN"` (plus `git add` for new files).
- [ ] **Step 8: Launch-flag flip.** Set `showLaunchLabel: false`, run `npm run build && node scripts/check-dist.mjs` and `grep -c data-launch-label dist/index.html dist/en*.html`. Expected: pass, counts 0. Set it back to `true` and rebuild. Don't commit the flip.
- [ ] **Step 9: Manual 360px check.** `npm run preview` and view `/` and `/en` at 360px width. Expected: no horizontal scroll, CTA and label visible, focus outline visible when tabbing. Note the result in the commit message of the next task, or here under Build notes.

### Task 3: Pricing and Contact

**Files:**
- Create: `src/views/Pricing.astro`, `src/views/Contact.astro`, `src/pages/precios.astro`, `src/pages/en/pricing.astro`, `src/pages/contacto.astro`, `src/pages/en/contact.astro`
- Modify: both JSON files (`pricing.*`, `contact.*`, `meta.pricing.*`, `meta.contact.*`)

**Interfaces:** Consumes `Base`, `CtaButton`, `t`/`tHtml`, `pathFor`. Produces nothing new.

- [ ] **Step 1:** Add the copy from the content file sections Pricing and Contact. Use `{price}` and `{supportEmail}`/`{operatorName}` tokens, never literals.
- [ ] **Step 2:** `npm run build && node scripts/check-dist.mjs`. Expected: PASS for 2 home pages. The new pages don't exist yet, so no errors from them.
- [ ] **Step 3:** Implement both views. Pricing has two plan cards, the Polar merchant-of-record note, the renewal line, links to `pathFor('refunds')` and `pathFor('terms')`, and `CtaButton`. Contact has a mailto link, the 2-business-day line, the operator line (via `tHtml` so `OPERATOR_NAME` is marked) and links to refunds and privacy.
- [ ] **Step 4:** `npm run check`. Expected: exit 0. 6 pages checked. Placeholder warnings for `/contacto` and `/en/contact`.
- [ ] **Step 5:** `grep -n '9.99' src/views src/i18n -r`. Expected: no matches (the price comes only from `site.ts`).
- [ ] **Step 6: Commit.** `feat: pricing and contact pages in ES/EN`

### Task 4: Terms, Refunds, Privacy

**Files:**
- Create: `src/components/LegalPage.astro`, `src/views/{Terms,Refunds,Privacy}.astro`, and the 6 route files (`terminos`, `reembolsos`, `privacidad`, `en/terms`, `en/refunds`, `en/privacy`)
- Modify: both JSON files (`terms`, `refunds`, `privacy`, `meta.*`)

**Interfaces:**
- JSON shape per legal page: `{ "title": string, "intro": string, "sections": [{ "heading": string, "paragraphs": string[], "items"?: string[] }] }`
- `LegalPage.astro` props `{ lang: Lang; page: 'terms' | 'refunds' | 'privacy' }`. It reads `tRaw(lang, page)` and renders `h1`, the `t(lang,'legal.updated')` line, then sections as `h2` + `<p set:html>` + optional `<ul>`. Strings from `tRaw` are already escaped and placeholder-marked.
- Each view is `<Base lang page><LegalPage lang page/></Base>`.

- [ ] **Step 1:** Write the copy into JSON from the content file. Terms has sections 1–12, Refunds 4 items, Privacy sections 1–11. **Don't publish the "Owner note" block.** Each page ends with the prevailing-language sentence (Spanish prevails). Write plain language, short sentences, and the same section count and order in both languages.
- [ ] **Step 2:** Add to `check-dist.mjs`: on each legal page, the ES and EN counterparts have the same number of `<h2>`, and the page contains the prevailing-language sentence (ES: `prevalece la versión en español`, EN: `the Spanish version prevails`). Run it. Expected: no failures yet (pages absent).
- [ ] **Step 3:** Implement `LegalPage` and the 3 views plus 6 routes.
- [ ] **Step 4:** `npm run check`. Expected: exit 0. 12 pages checked.
- [ ] **Step 5:** Manually check `/privacidad` at 360px for overflow (long processor names, email).
- [ ] **Step 6: Commit.** `feat: terms, refunds and privacy pages in ES/EN`

### Task 5: Sitemap, robots, icons, OG images, final checks

**Files:**
- Create: `src/pages/sitemap.xml.ts`, `public/robots.txt`, `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` (180×180), `public/og/og-es.png`, `public/og/og-en.png` (1200×630), `public/screenshots/.gitkeep`
- Create: `scripts/make-images.mjs` (generates the PNG/ICO from `favicon.svg` and two simple OG SVG templates using the wordmark plus the ES/EN hero line read from the JSON files). Add `sharp` as a devDependency for it. Commit the generated files.
- Modify: `scripts/check-dist.mjs`

**Interfaces:**
- `sitemap.xml.ts` exports `GET` returning `application/xml`. It has one `<url>` per path (12), each with `<loc>` and `<xhtml:link rel="alternate">` for es, en and x-default from `alternates(key)`. Namespaces: sitemap 0.9 and `http://www.w3.org/1999/xhtml`.
- `robots.txt`: `User-agent: *`, `Allow: /`, `Sitemap: https://digiworlds.store/sitemap.xml`.

- [ ] **Step 1:** Extend check-dist:
  - **all 12** route files must exist (missing = error)
  - `dist/sitemap.xml` has 12 `<loc>` matching `absoluteUrl` of every path, and 36 `xhtml:link`
  - `dist/robots.txt` contains the sitemap line
  - the favicon and OG files exist in `dist/`

  Run it. Expected: FAIL on sitemap, robots and images.
- [ ] **Step 2:** Implement the sitemap, robots and image script. Run `node scripts/make-images.mjs`.
- [ ] **Step 3:** `npm run check`. Expected: exit 0.
- [ ] **Step 4:** No global installs. Lighthouse is run by the owner after deploy (Task 6 checkpoint); note that here.
- [ ] **Step 5: Commit.** `feat: sitemap, robots, icons and Open Graph images`

### Task 6: Deploy guide, docs index, local Pages preview

**Files:**
- Create: `docs/deploy/README.md` (short index) plus `docs/deploy/cloudflare-pages.md`, `docs/deploy/dns.md`, `docs/deploy/editing.md`
- Create: `README.md` (short: what this is, `npm run dev`, `npm run check`, links to `docs/`)
- Create: `CLAUDE.md` (project facts: stack, where copy and config live, the check command, "Spanish prevails", "no pixels on this site")

**Content to cover (facts from spec §7 and §12):**
- **`cloudflare-pages.md`:**
  - Workers & Pages → Create → Pages → Connect to Git → repo `juanosorio1989/digiworlds`, production branch `main`
  - Framework preset Astro, build command `npm run build`, output `dist`, env `NODE_VERSION=22.23.5` (also `.nvmrc`)
  - Save and Deploy → check the `*.pages.dev` URL
  - Custom domains: add `digiworlds.store`, then `www.digiworlds.store`. Pages replaces the old A/AAAA and `www` records and asks for confirmation.
  - SSL/TLS: certificates are automatic. Turn on "Always Use HTTPS".
  - Rules → Redirect Rules: hostname equals `www.digiworlds.store` → `concat("https://digiworlds.store", http.request.uri.path)`, 301, preserve query string
  - Web Analytics: enable it in the Pages project → Metrics
  - **Owner checkpoint after first deploy:** `curl -sI https://digiworlds.store/precios.html` (expect 308 → `/precios`), `curl -sI https://digiworlds.store/en/` (record what happens), `curl -sI https://www.digiworlds.store/precios` (expect 301 → apex), and a Lighthouse mobile run on `/`
- **`dns.md`:**
  - today's records table (from spec §7)
  - what changes: the apex A/AAAA and www are replaced by Pages, and `ftp` is deleted manually
  - what must never change: MX, SPF, DKIM ×3, DMARC, autoconfig/autodiscover. **Don't enable Email Routing.**
  - the future `app` CNAME → Vercel is DNS only
- **`editing.md`:**
  - where to change copy (`src/i18n/*.json`), `OPERATOR_NAME` / email / price / launch flag (`src/config/site.ts`)
  - the **exact list of files containing `SUPPORT_EMAIL` / `OPERATOR_NAME`**, produced by running `grep -rln "SUPPORT_EMAIL\|OPERATOR_NAME" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro .` and pasting the output
  - redeploy: edit → `npm run check` → commit → push to `main` → Pages builds automatically (~1–2 min)
  - **Pre-Polar-review checklist:** launch flag off, `OPERATOR_NAME` filled, each privacy/terms promise compared with the real app (spec §13), legal review done, Polar product price = 9.99

- [ ] **Step 1:** Run `npm run build && npx wrangler pages dev dist --port 8788` in the background, then `curl -sI http://localhost:8788/precios` (expect 200), `curl -sI http://localhost:8788/precios.html` (expect 308 to `/precios`), `curl -sI http://localhost:8788/en` and `curl -sI http://localhost:8788/en/`. Paste the status lines into `cloudflare-pages.md` as "expected behavior (verified locally)". Stop the server. If wrangler tries to log in or create anything, abort and note it.
- [ ] **Step 2:** Write the docs.
- [ ] **Step 3:** `npm run check`. Expected: exit 0. Then run the grep from editing.md and confirm its output matches the list in the doc.
- [ ] **Step 4: Commit.** `docs: deploy guide, editing guide, README and project CLAUDE.md`

### After all tasks (main session)

- reviewer-opus final branch review against the spec.
- Owner pushes, or approves the push of, `main` and `feat/sales-site`, merges, then follows `docs/deploy/cloudflare-pages.md`.

## Build notes

(Filled in by Task 1 Step 7 and Task 2 Step 9.)
