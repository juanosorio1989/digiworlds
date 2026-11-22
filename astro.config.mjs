import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';
import { isPlaceholder } from './src/i18n/t.ts';

for (const k of ['supportEmail', 'operatorName']) {
  if (isPlaceholder(site[k])) console.warn(`WARN  site.${k} is still a placeholder ("${site[k]}"): fill it in src/config/site.ts`);
}

export default defineConfig({
  site: 'https://digiworlds.store',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
