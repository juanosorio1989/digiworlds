# DNS

The domain is registered at Hostinger. Its nameservers are on Cloudflare (zone `digiworlds.store`, free plan). Edit records in Cloudflare only.

## Records on 2026-11-22

| Record | Today | Action |
| --- | --- | --- |
| apex A `82.25.83.67`, AAAA `2a02:4780:...` (proxied) | Hostinger web hosting | Replaced by Pages when you add the custom domain |
| `www` CNAME `digiworlds.store` (proxied) | old alias | Replaced by Pages, then the redirect rule sends it to the apex |
| `ftp` A `82.25.83.67` (DNS only) | Hostinger leftover, exposes the origin IP | Delete by hand once the Hostinger site is retired |
| MX `mx1` and `mx2.hostinger.com` | Hostinger Mail | Never change |
| SPF TXT | Hostinger Mail | Never change |
| DKIM CNAME x3 | Hostinger Mail | Never change |
| DMARC TXT | Hostinger Mail | Never change |
| autoconfig, autodiscover CNAME | Hostinger Mail | Never change |

## Rules

- Email `info@digiworlds.store` runs on Hostinger Mail. Do not edit any email record.
- Do not enable Cloudflare Email Routing. It would replace the MX records.

## Later: the app

The app guide will add `app` CNAME to Vercel. Set it to DNS only (grey cloud). It is out of scope for this site.
