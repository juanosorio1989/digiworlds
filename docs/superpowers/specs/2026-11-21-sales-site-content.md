# digiworlds.store — page content outline (ES + EN)

Companion to [the design](2026-11-21-sales-site-design.md). This file is the source
for `src/i18n/es.json` and `src/i18n/en.json`. The builder may tighten the wording
but must keep the meaning, keep it plain, and use no invented claims.
`{supportEmail}`, `{operatorName}`, `{price}` and `{appUrl}` are filled in from
`site.ts`.

Style: short sentences, simple words, "tú" in Spanish.

## Shared UI

| Key | ES | EN |
|---|---|---|
| nav.home | Inicio | Home |
| nav.pricing | Precios | Pricing |
| nav.terms | Términos | Terms |
| nav.refunds | Reembolsos | Refunds |
| nav.privacy | Privacidad | Privacy |
| nav.contact | Contacto | Contact |
| switch.label | English | Español |
| cta.try | Probar gratis | Try it free |
| launch.label | Muy pronto | Coming soon |
| skip | Saltar al contenido | Skip to content |
| footer.copy | © 2026 digiworlds | © 2026 digiworlds |
| legal.updated | Última actualización: {date} | Last updated: {date} |

## Home

- **Title / meta:** "digiworlds — Mejora tu pronunciación en inglés" / "digiworlds — Improve your English pronunciation". Meta: one sentence on what it is and who it is for.
- **Hero h1:** "Habla inglés con más confianza" / "Speak English with more confidence".
- **Hero text:** "Practica la pronunciación del inglés americano desde tu celular. Escuchas, repites y recibes ayuda al instante, en español." / "Practice American English pronunciation on your phone. Listen, repeat, and get instant help in Spanish."
- **Who it is for:** "Para adultos hispanohablantes que viven en Estados Unidos." / "For Spanish-speaking adults living in the United States."
- **CTA:** button → `{appUrl}` + launch label if the flag is on.
- **3 benefits:**
  1. "Ayuda en cada sonido": you get feedback on each sound with a short spoken tip in Spanish. / "Help with every sound".
  2. "Mira cómo se hace": animations show where to put your tongue and lips. / "See how it's done".
  3. "No necesitas leer": you use it by listening and speaking. / "No reading needed".
- **3 steps:** "Escucha" (listen to the model) → "Repite" (say it out loud) → "Mejora" (see what to fix and try again). / "Listen" → "Repeat" → "Improve".
- **Screenshots:** 3 labeled placeholders: "Captura de pantalla de la app" / "App screenshot".
- **Pricing teaser:** "Empieza gratis. Premium cuesta US$ {price} al mes." + link to pricing. / "Start free. Premium is US$ {price} per month."
- **Install note:** "Funciona en el navegador y puedes instalarla en tu celular." / "Works in your browser, and you can install it on your phone."

## Pricing

- **h1:** "Precios" / "Pricing".
- **Free:** "Gratis — Las primeras lecciones son gratis. No necesitas tarjeta." / "Free — The first lessons are free. No card needed."
- **Premium:** "US$ {price} al mes — Todas las lecciones. Cancela cuando quieras." / "US$ {price} per month — All lessons. Cancel anytime."
- **Payments note:** "Los pagos los procesa Polar, nuestro comerciante registrado (merchant of record). Polar también cobra y paga los impuestos sobre las ventas." / "Payments are processed by Polar, our merchant of record. Polar also collects and pays sales tax."
- **Renewal line:** "La suscripción se renueva cada mes hasta que la canceles." / "Your subscription renews every month until you cancel."
- Links: refunds ("Reembolso completo en los primeros 14 días"), terms. CTA + launch label.

## Terms of service

Short headed sections, plain language:

1. **Quiénes somos / Who we are:** the service is run by `{operatorName}`, an individual based in Colombia. Contact `{supportEmail}`.
2. **Solo adultos / Adults only:** you must be 18 or older.
3. **El servicio / The service:** a digital pronunciation-practice service delivered online. It is not a school and gives no certificates.
4. **Sin garantía de resultados / No guaranteed results:** we do not promise that you will reach a specific English level.
5. **Planes y pagos / Plans and payments:** the free plan and Premium at US$ {price}/month. Polar is the merchant of record and processes payments and sales tax, and Polar's checkout terms also apply to the purchase.
6. **Renovación automática / Auto-renewal:** Premium renews monthly until cancelled.
7. **Cancelación / Cancellation:** cancel anytime from "Administrar suscripción" / "Manage subscription" in the app (Polar's customer portal) or by emailing `{supportEmail}`. You keep access until the end of the period you already paid.
8. **Reembolsos / Refunds:** see the refund policy (link).
9. **Uso aceptable / Acceptable use:** personal use, no sharing accounts, no abuse of the service.
10. **Cambios / Changes:** we may update these terms. We will show the date and, for important changes, notify by email.
11. **Ley aplicable / Governing law:** the laws of Colombia.
12. **Idioma / Language:** "Estos términos existen en español e inglés. Si hay diferencias, prevalece la versión en español." / "These terms exist in Spanish and English. If they differ, the Spanish version prevails."

## Refund policy

- **Full refund within 14 days** of your first payment. Email `{supportEmail}` with the email of your account.
- **After 14 days:** no refund for the current period. Cancel to stop the next renewal. You keep access until the period ends.
- **How it is paid:** refunds are issued through Polar to the original payment method. The bank may take several days.
- Prevailing-language line (Spanish prevails).

## Privacy policy

> **Owner note (not published):** this policy describes the app *as designed*. The
> app today has none of these features. Before the Polar review (M2), check every
> line against the real app and remove anything that does not exist yet. A short
> legal review (voice data, US state biometric laws) is planned before launch.

1. **Responsable / Who is responsible:** `{operatorName}`, Colombia, `{supportEmail}`.
2. **Datos que recogemos / Data we collect:** account email and name (including from "Continuar con Google" / "Continue with Google"), learning progress, pronunciation scores, notification subscription (if you allow reminders), and basic technical data needed for bot protection.
3. **Tu voz / Your voice:** your voice is sent to Microsoft Azure to score your pronunciation and is then discarded. It is **only stored** if you turn on "Guardar mis grabaciones" / "Save my recordings", which is off by default. Stored recordings are kept in Cloudflare R2. The spoken tips in Spanish are pre-generated by Azure and never use your voice.
4. **Para qué / Why:** to run the service, show your progress, send sign-in links and reminders, handle payments and support, protect against bots, and measure our ads.
5. **Proveedores / Processors:**
   - Supabase: accounts and progress data.
   - Microsoft Azure Speech: pronunciation scoring and spoken tips.
   - Vercel: app hosting.
   - Polar: payments, sales tax and the subscription portal.
   - Cloudflare: DNS, this website and its cookieless statistics, R2 storage (app audio and saved recordings), Turnstile (bot protection).
   - Google: "Continue with Google" sign-in.
   - An email provider (e.g. Resend): sign-in links. *The final name is confirmed at M2.*
   - Browser push services (Apple, Google, Mozilla): reminders.
   - Meta and TikTok: ad measurement (pixels and server events). They only receive events such as visit, sign-up, payment and purchase, **never audio, scores or sounds**.
6. **No vendemos tus datos / We do not sell your data** for money. Sharing ad events with Meta and TikTok may count as "sharing" under some US state laws. You can opt out with the "No vender ni compartir mi información" / "Do not sell or share my personal information" link, or with your browser's Global Privacy Control signal.
7. **Cookies:** sign-in session cookies (needed), Turnstile cookies (bot protection), and Meta/TikTok ad cookies (turned off by the opt-out above or by GPC). No product analytics such as Google Analytics.
8. **Cancelar / Cancelling:** from "Administrar suscripción" / "Manage subscription" in the app, which opens Polar's customer portal, or by email.
9. **Borrar tus datos / Deleting your data:** email `{supportEmail}` and we delete your account, progress and any saved recordings.
10. **Menores / Minors:** the service is for adults 18+ only.
11. **Cambios / Changes** and the prevailing-language line (Spanish prevails).

## Contact

- **h1:** "Contacto" / "Contact".
- "Escríbenos a {supportEmail}. Respondemos en un máximo de 2 días hábiles." / "Email us at {supportEmail}. We reply within 2 business days."
- "digiworlds es operado por {operatorName}, una persona natural con sede en Colombia." / "digiworlds is operated by {operatorName}, an individual based in Colombia."
- Links to refunds and privacy for common requests (refunds, data deletion).
