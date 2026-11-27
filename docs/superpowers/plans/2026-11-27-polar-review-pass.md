# Pre-Polar-review pass (written 2026-11-27, run at M2)

Run this only when the app works end to end, including a real purchase flow. Polar reviews the product, not only
the website: every product must deliver on purchase, and the reviewers may ask for a 100% discount code or a video
of the full purchase. Sources: polar.sh/docs/merchant-of-record/account-reviews, `.../review-checklist` and
`.../acceptable-use` (read 2026-11-27).

Branch: `feat/polar-review`. Owner inputs needed before dispatch: the legal name for `operatorName`, 3 app
screenshots (PNG, portrait phone, same size), and the list of features the real app has (task 3).

## Routing

| Task | What | Implementer | Reviewer | Why |
|---|---|---|---|---|
| 1 | Operator name + dist guard | implementer-sonnet | reviewer-opus | One value + one check, fully specified |
| 2 | Real screenshots on the home page | implementer-sonnet | reviewer-opus | Static assets + one component |
| 3 | Privacy and terms match the real app | Opus 5.5 (main) with owner | reviewer-opus | Legal accuracy, needs judgment about the app |
| 4 | Launch label off | implementer-sonnet | reviewer-opus | One flag; must be last |
| 5 | Owner checks (Cloudflare, Polar dashboard) | owner | — | Accounts and dashboards |
| Final | Branch review | — | reviewer-opus | Lab rule |

Main session: Opus 5.5 (orchestrates, merges).

## Task 1: operator name and guard

- `src/config/site.ts`: `operatorName` = the owner's legal name, exactly as verified in Stripe Identity.
- `scripts/check-dist.mjs`, in `checkPage`: error (not warning) if the page HTML contains `OPERATOR_NAME`:
  `if (html.includes('OPERATOR_NAME')) err('operator name placeholder still in page');`
- Acceptance: `grep -rn OPERATOR_NAME src dist` finds only the check itself in `scripts/`; `npm run check` passes.

## Task 2: real screenshots

- Copy the owner's PNGs to `src/assets/screenshots/screen-1.png`, `screen-2.png`, `screen-3.png` (tracked).
  Remove the empty `public/screenshots/` folder.
- Replace `src/components/ScreenshotPlaceholder.astro` with `src/components/Screenshot.astro`: props
  `lang`, `index` (1-3); renders `<figure class="phone"><Image src=… alt={t(lang, \`home.screenshotAlt${index}\`)}
  width={360} loading="lazy" /></figure>` using `astro:assets`. Keep the existing `.phone` styles; drop the
  placeholder-only styles.
- `src/views/Home.astro`: `[1, 2, 3].map((i) => <li><Screenshot lang={lang} index={i} /></li>)`.
- `src/i18n/es.json` and `en.json`: replace `home.screenshot` with `home.screenshotAlt1..3`, each a one-line
  description of what that screen shows (owner gives the meaning; Spanish first).
- Acceptance: `npm run check` passes; the built home page has 3 `<img>` with non-empty `alt` in each language.

## Task 3: privacy and terms match the real app

The current privacy policy describes the app as designed (spec: `docs/superpowers/specs/2026-11-21-sales-site-content.md`,
owner note). For each item, keep it only if the real app does it today; otherwise remove it in both languages:

- Meta and TikTok pixels / server events, their cookies, the "Do not sell or share" link and the GPC sentence
  (sections 4, 5, 6, 7). If ads tracking ships, the opt-out link must exist in the app before the review.
- "Save my recordings" and Cloudflare R2 for recordings (section 3, section 9).
- Reminders and browser push services (sections 2, 4, 5).
- "Continue with Google" (sections 2, 5).
- Email provider: name the real one, no "for example" (section 5).
- Turnstile (sections 2, 5, 7).
- Terms section 7 / privacy section 8: the "Manage subscription" button exists in the app.

Then bump `legalUpdated` in `src/config/site.ts`. The planned legal review (voice data, US state biometric laws)
happens before this task is closed. Acceptance: owner signs off each line; `npm run check` passes.

## Task 4: launch label off (last code change)

- `src/config/site.ts`: `showLaunchLabel: false`.
- Acceptance: `npm run check` passes (it already fails if any page still has `data-launch-label`).

## Task 5: owner checks (after deploy of tasks 1-4)

- [ ] `curl -sS -o /dev/null -w '%{http_code} %{time_total}\n' -A 'Polar/1.0 (+https://polar.sh)' https://digiworlds.store/`
      returns 200 in under 5 s. Same for `https://app.digiworlds.store/`. If Bot Fight Mode or Turnstile blocks it,
      allow that user agent.
- [ ] Polar product description (30+ characters) says "pronunciation practice with feedback", not "AI voice",
      to stay out of the AI voice-generation review path.
- [ ] Polar product price is 9.99, matching `premiumPriceUsd`; checkout has a success URL back to the app.
- [ ] Support email verified in Polar; check `info@digiworlds.store` daily during the review (48 h reply window).
- [ ] Test the purchase with a 100% discount code, never a real card.
- [ ] Have a 100% discount code and a short screen recording of the purchase ready for the reviewers.
