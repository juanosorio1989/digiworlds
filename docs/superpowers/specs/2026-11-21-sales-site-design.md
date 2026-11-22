# digiworlds.store sales site — design

Date: 2026-11-21 · Status: approved 2026-11-22
Page copy outline: [2026-11-21-sales-site-content.md](2026-11-21-sales-site-content.md)

## 1. Intent

A static, bilingual (Spanish + English) marketing and legal website for
`digiworlds.store`, hosted on Cloudflare Pages.

- **Now:** be ready for Polar's merchant review. Polar must see a clear product,
  visible prices, terms, a refund policy, a privacy policy and a way to contact support.
- **Later:** explain the product to future customers.

The product is an American English pronunciation trainer (a PWA at
`https://app.digiworlds.store`, a separate project on Vercel). It is for
Spanish-speaking adults (18+) living in the US. Learners listen, repeat and get
instant feedback on each sound, with a short spoken tip in Spanish. Mouth animations
show where the tongue and lips go. No reading is needed.

Audience: Spanish is the main audience (US Latinos). English serves reviewers,
partners and bilingual visitors.

## 2. Goals, non-goals, anti-goals

**Goals**
- 6 pages × 2 languages = 12 pages with the same content and structure.
- One place per language for copy. One shared place for `SUPPORT_EMAIL`,
  `OPERATOR_NAME` and the launch-label flag.
- Mobile first, large text, high contrast, fast on cheap Android phones.

**Non-goals**
- No backend, CMS, WordPress, contact form, login or checkout on this site. The site
  links to the app, and checkout happens in the app through Polar.
- No blog or extra pages.

**Anti-goals** (a failure even if everything else works)
- Fake testimonials, user counts, ratings, lorem ipsum or template text.
- A page that mixes languages.
- A language switcher that drops the visitor on the home page.
- Auto-redirecting visitors by browser language.
- Heavy JavaScript or web fonts that slow down cheap phones.

## 3. Constraints and decisions made with the owner

| Topic | Decision |
|---|---|
| Stack | **Astro, static output** (chosen over hand-written HTML; see §4) |
| Launch timing | The app is not configured yet. The site ships now with the launch label ON. The owner turns it OFF and requests Polar review once the free lessons work in the app. Polar is in sandbox today. |
| Prevailing language | **The Spanish version prevails** if the two versions differ (terms, refunds, privacy). |
| Governing law | Colombia |
| Operator | An individual based in Colombia (`OPERATOR_NAME`) |
| Prices | Free plan (first lessons free, no card needed). Premium USD 9.99/month, cancel anytime. Polar is the merchant of record and handles sales tax. |
| Refunds | Full refund within 14 days of the first payment, on request by email, issued through Polar. After that, cancel to stop renewal. |
| Code language | Code, file names and comments in English |

## 4. Approaches considered

1. **Astro, static output (picked).** It gives one layout and one footer, one JSON
   file per language, and one config file. The build writes plain HTML to `dist/`,
   and Cloudflare Pages builds on every push. The cost is a Node toolchain and
   occasional dependency updates.
2. **Hand-written HTML/CSS.** Nothing to install. But the header and footer get
   copied 12 times, and the copy is mixed into the layout. Meeting the "one place"
   rules would need a homemade replace script, which is a worse generator.
3. **Eleventy.** Similar to Astro, but i18n would be built by hand. Dropped.

**Why Astro:** for 12 pages under strict single-source rules, it is the simplest
thing to maintain. Editing copy means editing a JSON file. Hiding the launch label
means changing `true` to `false`.

## 5. Architecture

### 5.1 File layout

```
/
├─ astro.config.mjs          # site URL, build.format, trailingSlash
├─ package.json              # scripts: dev, build, preview, check
├─ .nvmrc                    # Node version, also used by Cloudflare Pages
├─ public/
│  ├─ favicon.svg, favicon.ico, apple-touch-icon.png
│  ├─ og/og-es.png, og/og-en.png     # 1200×630 Open Graph images
│  ├─ screenshots/                   # real screenshots later; empty now
│  └─ robots.txt
├─ src/
│  ├─ config/site.ts         # SUPPORT_EMAIL, OPERATOR_NAME, showLaunchLabel, URLs, price
│  ├─ i18n/
│  │  ├─ es.json             # all Spanish copy
│  │  ├─ en.json             # all English copy (same keys)
│  │  ├─ routes.ts           # page key → { es: path, en: path }
│  │  └─ t.ts                # lookup + {placeholder} interpolation
│  ├─ layouts/Base.astro     # <html lang>, head/SEO, header, footer
│  ├─ components/            # Header, Footer, LangSwitch, LaunchLabel, CtaButton, ScreenshotPlaceholder
│  ├─ views/                 # one component per page: Home, Pricing, Terms, Refunds, Privacy, Contact
│  ├─ pages/                 # 12 thin route files, each renders a view with a lang
│  │  ├─ index.astro, precios.astro, terminos.astro, reembolsos.astro, privacidad.astro, contacto.astro
│  │  ├─ en/index.astro, en/pricing.astro, en/terms.astro, en/refunds.astro, en/privacy.astro, en/contact.astro
│  │  └─ sitemap.xml.ts      # generated from routes.ts
│  └─ styles/global.css
├─ scripts/check-dist.mjs    # post-build checks (see §9)
└─ docs/                     # this spec, plan, deploy guide
```

### 5.2 i18n approach

- **Route map** (`src/i18n/routes.ts`) is the single source for URLs. It lists 6
  page keys (`home, pricing, terms, refunds, privacy, contact`), each with its Spanish
  path and English path. The switcher, footer links, hreflang tags, canonical URLs
  and sitemap all read from it.
- Astro's built-in i18n routing is **not** used. It assumes the same slug in each
  locale folder, and we have translated slugs (`/precios` vs `/en/pricing`). A small
  route map is simpler and makes it explicit.
- **Copy:** `es.json` and `en.json` have identical key trees, for example
  `pricing.premium.price`. Views never contain literal text, only `t(lang, key)`.
  Legal pages are stored as arrays of sections (`heading` and `paragraphs`), so long
  text stays in JSON and out of the layout.
- **Interpolation:** copy may contain `{supportEmail}`, `{operatorName}`,
  `{price}`, `{appUrl}`. `t()` fills them from `site.ts`, so the email and name are
  never typed into a JSON file.
- **Language switcher:** in the header and footer of every page. It links to the
  same page key in the other language and is labeled in the target language
  ("English" / "Español") with `lang` and `hreflang` set on the link.

### 5.3 Single-source values (`src/config/site.ts`)

```ts
export const site = {
  supportEmail: 'SUPPORT_EMAIL',     // ← fill in once
  operatorName: 'OPERATOR_NAME',     // ← fill in once
  showLaunchLabel: true,             // ← false once the app is live
  appUrl: 'https://app.digiworlds.store',
  siteUrl: 'https://digiworlds.store',
  premiumPriceUsd: '9.99',
  copyrightYear: 2026,
};
```

- **Where the placeholders appear:** `SUPPORT_EMAIL` and `OPERATOR_NAME` appear
  only in `src/config/site.ts`. They are also checked by `scripts/check-dist.mjs`,
  which looks for the literal strings, and mentioned in `docs/deploy/README.md`. The
  final file list goes in the deploy guide and is verified with
  `grep -rn "SUPPORT_EMAIL\|OPERATOR_NAME" --exclude-dir=node_modules --exclude-dir=dist`.
- **Clearly marked:** while a value is still a placeholder, it renders inside
  `<mark class="placeholder">` so it stands out on the page. The build prints a
  warning (it does not fail, so the owner can deploy a preview).
- **Launch label:** `showLaunchLabel` controls the "Muy pronto" / "Coming soon"
  badge next to every "Probar gratis" / "Try it free" button, in both languages.

## 6. Pages

The section outline for each page and the copy in both languages are in the
[content file](2026-11-21-sales-site-content.md). The structure:

| Key | ES path | EN path | Sections |
|---|---|---|---|
| home | `/` | `/en` | Hero (what + who), CTA + launch label, 3 benefits, 3 steps "Escucha, Repite, Mejora" / "Listen, Repeat, Improve", 3 screenshot placeholders, short pricing teaser → pricing |
| pricing | `/precios` | `/en/pricing` | Free card, Premium card ($9.99/mo, cancel anytime), Polar = merchant of record + sales tax, links to refunds/terms, CTA |
| terms | `/terminos` | `/en/terms` | Plain-language sections (see content file), "last updated" date, prevailing-language clause (Spanish) |
| refunds | `/reembolsos` | `/en/refunds` | 14-day full refund, how to ask, issued via Polar, cancel to stop renewal |
| privacy | `/privacidad` | `/en/privacy` | Data collected, voice handling, processors, no selling, analytics, deletion, contact |
| contact | `/contacto` | `/en/contact` | Support email (mailto), response within 2 business days, operator identity and country |

**Footer on every page:** links to all 6 pages in the current language, the support
email, the language switcher and "© 2026 digiworlds".

404 pages (ES `/404`, EN `/en/404`): noindex, not in sitemap — plumbing, not content (controller ruling R8).

**Screenshot placeholders:** neutral phone-shaped boxes with a visible label from
the copy files ("Captura de pantalla de la app" / "App screenshot") and matching alt
text. They are honest placeholders, not fake UI. They get replaced by images in
`public/screenshots/` later.

## 7. Routing, URLs and domain

- **Default language:** Spanish at `/`, English under `/en`. **No auto-detection or
  redirect** by browser language, only the visible switcher. `x-default` hreflang
  points to the Spanish page.
- **Clean URLs:** `build.format: 'file'` plus `trailingSlash: 'never'`. Astro writes
  `precios.html`, and Cloudflare Pages serves it at `/precios` and 308-redirects
  `/precios.html` → `/precios`. Canonical URLs have no trailing slash, and the English
  home is `/en`. *The builder must confirm the real `dist/` output and Pages
  behavior in a preview deploy, including that `/en/` redirects to `/en`, and adjust
  if Astro emits `en/index.html` instead.*
- **Domain:** the apex `digiworlds.store` is canonical. `www.digiworlds.store` is
  added to the Pages project and 301-redirected to the apex with a Cloudflare Redirect
  Rule (Pages `_redirects` cannot match on hostname). `app.digiworlds.store` stays a
  DNS-only (grey cloud) CNAME to Vercel and is untouched. The `*.pages.dev` hostname
  is left as is. Canonical tags point to the apex, so it doesn't compete in search.
- **Current DNS (checked 2026-11-22):** the domain is registered at Hostinger, and
  its nameservers are on Cloudflare (zone `digiworlds.store`, free plan, full
  setup). So an apex custom domain on Pages works with no transfer. Today's records:
  - The apex `A 82.25.83.67` and `AAAA 2a02:4780:…` (proxied) point to Hostinger
    web hosting. **They are replaced** when the Pages custom domain is attached.
  - `www CNAME digiworlds.store` (proxied) is replaced by the Pages www domain and
    the redirect rule.
  - `ftp A 82.25.83.67` (DNS only) is a Hostinger leftover that exposes the origin
    IP. The guide suggests deleting it once the Hostinger site is retired, after the
    owner confirms.
  - **Email stays on Hostinger Mail** (`info@digiworlds.store`): MX `mx1/mx2.hostinger.com`,
    SPF TXT, 3 DKIM CNAMEs, DMARC TXT, plus autoconfig/autodiscover CNAMEs. The guide
    must **not touch these** and must **not enable Cloudflare Email Routing**, which
    would replace the MX records.
  - There is no `app` record yet. The app's guide adds `app CNAME` → Vercel (DNS only)
    later. It is out of scope here, but the guide notes it.

## 8. SEO, accessibility, analytics

**SEO (per page, per language, all from JSON):** `<title>`, meta description,
canonical, `hreflang` es/en/x-default, Open Graph (`og:title`, `og:description`,
`og:image` per language, `og:locale` `es_US` / `en_US`, `og:locale:alternate`),
favicon set, `sitemap.xml` listing all 12 URLs with `xhtml:link` alternates, and
`robots.txt` allowing everything and pointing to the sitemap.

**Accessibility:**
- Base font 18px, line-height ≥ 1.5, headings ≥ 1.5rem. System font stack, no web
  fonts.
- Body text contrast ≥ 7:1, and UI ≥ 4.5:1 (WCAG AA minimum, AAA for body text).
- Visible `:focus-visible` outline (3px, high contrast). Tap targets ≥ 48×48px with
  spacing.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, a skip
  link, correct `lang` on `<html>` and on the switcher link.
- Works with no JavaScript. Respects `prefers-reduced-motion`.
- Layout tested at 360px wide. Single column on mobile.

**Analytics:** Cloudflare Web Analytics, which is cookieless and needs no cookie
banner, enabled from the Pages dashboard. The privacy policy mentions it under
processors (Cloudflare) as aggregate, cookieless visit statistics.

**Visual identity (builder's call):** there is no logo or brand palette yet. Use a
text wordmark "digiworlds" and a simple 2–3 color palette that meets the contrast
rules. All colors live as CSS custom properties in `global.css`, so a brand palette
can be swapped in later.

## 9. Quality checks

- `npm run check` runs `astro check`, then a build, then `scripts/check-dist.mjs`,
  which asserts:
  - `es.json` and `en.json` have identical key sets.
  - Every built page has the correct `<html lang>`, a canonical, 3 hreflang links,
    a title and a meta description.
  - Every page links to its own counterpart through the switcher.
  - The sitemap lists 12 URLs.
  - No `{token}` is left uninterpolated.
  - It warns if `SUPPORT_EMAIL` or `OPERATOR_NAME` are still placeholders.
- Manual check: a Lighthouse mobile run on Home (target Accessibility 100,
  Performance ≥ 95) and a click-through of every switcher link.

## 10. Polar review readiness

What a reviewer typically looks for, and where the site covers it:

- A clear description of what is sold, to whom, and the price → Home and Pricing.
- Terms, refund policy and privacy policy, reachable from every page → footer.
- A working support email and an identifiable operator → Contact and footer.
- A statement that Polar is the merchant of record → Pricing and Terms.
- Prices in the site matching the product configured in Polar ($9.99/mo).
- The site's domain matching the one given to Polar.
- **A product the reviewer can actually try** → the reason the launch label goes
  OFF and the app's free lessons must work *before* requesting review.

The owner should verify Polar's current review requirements in its dashboard and
docs at submission time.

## 11. Deliverables

1. This design doc and the content file.
2. An implementation plan (next step).
3. `docs/deploy/README.md`: step-by-step Cloudflare Pages deploy. It covers GitHub
   repo → Pages project (Git-connected), framework preset Astro, build command
   `npm run build`, output `dist`, Node version, custom domains (apex and www), DNS
   records, the www→apex redirect rule, HTTPS (automatic certs, "Always Use HTTPS"),
   enabling Web Analytics, and how to redeploy after editing `site.ts` (edit →
   commit → push → automatic build).

Legal pages are a plain-language starting point. The owner will have them reviewed.

## 12. Calls made during the builder check

- **CTA while the launch label is on:** stays a live link to `{appUrl}` with the
  badge beside it, as the owner specified. The owner requests Polar review only
  after the flag is off (see §3).
- **Cloud resources:** the GitHub repo already exists
  (`github.com/juanosorio1989/digiworlds`, cloned locally). The owner creates the
  Pages project by following the deploy guide. The builder never creates cloud resources. The builder
  verifies clean URLs locally with `wrangler pages dev dist`, and the plan ends with
  an owner checkpoint to confirm redirects on the first real deploy.
- **App facts in legal pages:** the plan includes an owner sign-off step. Before the
  legal copy is final, the owner confirms the data list, voice storage, in-app
  cancellation and the processor list against the real app.

- **No ad pixels on this site for now** (owner decision). Meta/TikTok pixels live
  only in the app. Adding them here later is a separate change. It would need a footer
  "No vender ni compartir mi información" / "Do not sell or share my personal
  information" link, GPC handling and a JS loader.
- **Hostinger web hosting is retired** (owner decision). Nothing from the current
  site is kept. Only Hostinger Mail stays. The deploy guide removes the old apex
  A/AAAA and `www` records (Pages replaces them) and deletes the `ftp` record.
- **Support email:** `info@digiworlds.store` (Hostinger Mail, already working).
  `site.ts` may ship with it filled in. The `SUPPORT_EMAIL` placeholder mechanism stays
  for `OPERATOR_NAME` and future edits.

## 13. Legal pages describe the app as designed

The app today is only test pages (recorder, Azure scoring, mouth animation), with
no accounts, subscriptions, pixels, analytics or cookies. The policies describe the
**finished app as designed**. Before requesting Polar review (milestone M2), the owner
compares every promise with what the app does at that time and edits the copy. A
short legal review of the privacy policy and the voice-consent text is planned
before launch (voice data and US state biometric laws). The plan carries this as an
explicit pre-review checkpoint.
