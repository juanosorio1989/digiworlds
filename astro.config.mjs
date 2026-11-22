import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://digiworlds.store',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
