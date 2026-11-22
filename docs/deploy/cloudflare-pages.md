# Cloudflare Pages

Dashboard labels are described as of 2026-11-22 and were not checked against the live UI. They may change.

## 1. Create the project

1. Workers & Pages → Create → Pages → Connect to Git.
2. Pick the repo `juanosorio1989/digiworlds`. Production branch: `main`.
3. Framework preset: Astro. Build command: `npm run build`. Output directory: `dist`.
4. Environment variable: `NODE_VERSION` = `22.23.5` (the repo also has `.nvmrc`).
5. Save and Deploy. Open the `*.pages.dev` URL and check the site.

## 2. Custom domains

1. In the project: Custom domains → add `digiworlds.store`, then `www.digiworlds.store`.
2. Pages replaces the old apex A/AAAA records and the `www` record. It asks for confirmation. Confirm.
   If it refuses because a record already exists, delete only the apex A, the apex AAAA and the `www` CNAME in DNS, then add the domain again. Never delete MX/TXT/DKIM/autoconfig/autodiscover records.
3. Do not touch any email record. See [dns.md](dns.md).

## 3. HTTPS

- Certificates are automatic.
- SSL/TLS → Edge Certificates → turn on "Always Use HTTPS".

## 4. Redirect www to the apex

Pages `_redirects` cannot match a hostname, so use a Cloudflare rule.

Rules → Redirect Rules → Create rule:

- When: hostname equals `www.digiworlds.store`
- Then: dynamic redirect to `concat("https://digiworlds.store", http.request.uri.path)`
- Status code: 301. Preserve query string: on.

## 5. Web Analytics

In the Pages project → Metrics → enable Web Analytics. It is cookieless, so no banner is needed.

## Expected behavior (verified locally)

Checked with `npx wrangler pages dev dist --port 8788` on 2026-11-22:

| Request | Status |
| --- | --- |
| `/precios` | `HTTP/1.1 200 OK` |
| `/precios.html` | `HTTP/1.1 308 Permanent Redirect`, `Location: /precios` |
| `/en` | `HTTP/1.1 200 OK` |
| `/en/` | `HTTP/1.1 308 Permanent Redirect`, `Location: /en` |

## Owner checkpoint after the first deploy

Run these against the real site and confirm:

```
curl -sI https://digiworlds.store/precios.html     # expect 308 to /precios
curl -sI https://digiworlds.store/en/              # record what happens (local test gave 308 to /en)
curl -sI https://www.digiworlds.store/precios      # expect 301 to https://digiworlds.store/precios
```

Then run a Lighthouse mobile test on `https://digiworlds.store/`.
