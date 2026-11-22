# digiworlds sales site

- Stack: Astro 7 static site, TypeScript, Node 22 (`.nvmrc`). Hosted on Cloudflare Pages. No client JS framework.
- Copy lives only in `src/i18n/es.json` and `src/i18n/en.json`. No literal text in `.astro` files. Use `t()` / `tHtml()` / `tRaw()`.
- Values (operator, email, price, launch flag, URLs) live only in `src/config/site.ts`.
- Routes: `src/i18n/routes.ts`. Spanish at `/`, English under `/en`.
- `npm run check` = astro check + unit tests + build + `scripts/check-dist.mjs`. Run it before every commit.
- Spanish prevails over English in legal text.
- No ad pixels or tracking scripts in the source. The only third-party script is the Cloudflare Web Analytics beacon, injected by Pages.
- Email `info@digiworlds.store` runs on Hostinger Mail. Never change its DNS records or enable Cloudflare Email Routing.
- Docs: `docs/deploy/` (deploy, DNS, editing), `docs/superpowers/` (specs and plans).
