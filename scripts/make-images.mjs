// Regenerates public/favicon.*, apple-touch-icon.png and og/og-<lang>.png. Run: node scripts/make-images.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BRAND = '#0b4f9c';
const TEXT = '#10203a';
const BG = '#ffffff';
const FONT = 'DejaVu Sans, Helvetica, Arial, sans-serif';
const root = new URL('../public/', import.meta.url);
const out = (p) => new URL(p, root);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Spiral mark: crop the original logo (alpha bbox ~259,137,766,646) to a 512x512 PNG.
const brandDir = new URL('../src/assets/brand/', import.meta.url);
const spiralPath = fileURLToPath(new URL('spiral.png', brandDir));
await sharp(fileURLToPath(new URL('blanco2.png', brandDir)))
  .extract({ left: 258, top: 136, width: 510, height: 510 })
  .resize(512, 512)
  .png()
  .toFile(spiralPath);
const spiral = (size) => sharp(spiralPath).resize(size, size).png().toBuffer();

// Favicon: transparent SVG embedding the spiral (128px data shown at 64x64).
const spiral128 = (await spiral(128)).toString('base64');
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" width="64" height="64">
  <image width="64" height="64" href="data:image/png;base64,${spiral128}" xlink:href="data:image/png;base64,${spiral128}"/>
</svg>
`;
writeFileSync(out('favicon.svg'), faviconSvg);

// Apple touch icon: white background (iOS fills transparency black), spiral 150x150 centered.
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: await spiral(150), left: 15, top: 15 }])
  .png()
  .toFile(fileURLToPath(out('apple-touch-icon.png')));

// ICO with one 32x32 PNG image (PNG-in-ICO is valid for all current browsers).
const png32 = await spiral(32);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync(out('favicon.ico'), Buffer.concat([header, png32]));

// Wrap text into lines of at most `max` characters.
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

mkdirSync(out('og/'), { recursive: true });
for (const lang of ['es', 'en']) {
  const json = JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
  const title = wrap(json.home.hero.title, 26);
  const tspans = title
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 84}">${esc(l)}</tspan>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="24" fill="${BRAND}"/>
  <text x="196" y="126" font-family="${FONT}" font-size="48" font-weight="700" fill="${BRAND}">digiworlds</text>
  <text x="80" y="300" font-family="${FONT}" font-size="72" font-weight="700" fill="${TEXT}">${tspans}</text>
</svg>`;
  await sharp(Buffer.from(svg))
    .composite([{ input: await spiral(96), left: 80, top: 60 }])
    .png()
    .toFile(fileURLToPath(out(`og/og-${lang}.png`)));
}
console.log('images generated');
