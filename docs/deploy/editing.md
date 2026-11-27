# Editing the site

## Where things live

- Copy (all text, both languages): `src/i18n/es.json` and `src/i18n/en.json`. Keep both files in step. `npm run check` fails if a key is missing in one.
- Values: `src/config/site.ts` has `operatorName`, `supportEmail`, `premiumPriceUsd`, `showLaunchLabel` (the "Muy pronto" / "Coming soon" label), the app and site URLs.
- Spanish prevails over English in the legal pages.

Files that contain `SUPPORT_EMAIL` or `OPERATOR_NAME`
(`grep -rln "SUPPORT_EMAIL\|OPERATOR_NAME" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro .`):

- `docs/deploy/editing.md`
- `docs/superpowers/plans/2026-11-22-sales-site.md`
- `docs/superpowers/specs/2026-11-21-sales-site-design.md`
- `src/config/site.ts`
- `src/i18n/t.ts`
- `tests/t.test.ts`

Only `src/config/site.ts` should hold the real values. The others are tests, the placeholder helper, planning docs and this page.

## Images

After changing the hero copy (`home.hero.*`) or the brand colors, run `node scripts/make-images.mjs` and commit the regenerated PNG/ICO files.

## Logo and icons

The source logo is `src/assets/brand/blanco2.png` (1024x1024, transparent). Run `node scripts/make-images.mjs` to regenerate `src/assets/brand/spiral.png` (cropped spiral, used in the header), `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` and `public/og/og-<lang>.png`. Commit the results.

## Redeploy

1. Edit.
2. `npm run check` (must exit 0).
3. Commit.
4. Push to `main`. Pages builds automatically (about 1-2 minutes).

## Before requesting the Polar review

Full steps: [the pre-review plan](../superpowers/plans/2026-11-27-polar-review-pass.md).

- [ ] Launch flag off (`showLaunchLabel: false`) and the app's free lessons work.
- [ ] `operatorName` and `supportEmail` filled in (no placeholder warnings in `npm run check`).
- [ ] Each privacy and terms promise compared with what the real app does.
- [ ] Legal review done (voice data, US state biometric laws).
- [ ] The Polar product price is 9.99, matching `premiumPriceUsd`.
- [ ] Real app screenshots on the home page (no "App screenshot" boxes).
- [ ] The site and the app answer the `Polar/1.0 (+https://polar.sh)` user agent in under 5 s.
