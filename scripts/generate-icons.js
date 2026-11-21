import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');
const svgSource = fs.readFileSync(SVG_PATH, 'utf-8');
const svgBuffer = Buffer.from(svgSource, 'utf-8');

function buildFullBleedSvg(source, { artworkScale = 1 } = {}) {
  let result = source
    .replace(/rx="116"/g, 'rx="0"')
    .replace(/\s*<rect id="squircle-rim"[^>]*\/>/g, '');

  if (artworkScale !== 1) {
    result = result.replace(
      '<g id="logo-artwork">',
      `<g id="logo-artwork" transform="translate(256, 256) scale(${artworkScale}) translate(-256, -256)">`
    );
  }

  return Buffer.from(result, 'utf-8');
}

async function generate() {
  console.log('Syncing SVG icon variants and generating PWA raster icons...');

  // Keep pwa-192x192.svg and pwa-512x512.svg identical to favicon.svg
  fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.svg'), svgSource, 'utf-8');
  console.log('✓ public/pwa-192x192.svg');

  fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.svg'), svgSource, 'utf-8');
  console.log('✓ public/pwa-512x512.svg');

  // 1. apple-touch-icon.png (180x180 full-bleed square for iOS native squircle masking)
  const appleFullBleedSvg = buildFullBleedSvg(svgSource);
  await sharp(appleFullBleedSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png (180x180 full-bleed)');

  // 2. pwa-192x192.png (squircle)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
  console.log('✓ public/pwa-192x192.png (192x192)');

  // 3. pwa-512x512.png (squircle)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
  console.log('✓ public/pwa-512x512.png (512x512)');

  // 4. maskable-icon-512x512.png (512x512 full-bleed background with 82% safe-zone artwork)
  const maskableFullBleedSvg = buildFullBleedSvg(svgSource, { artworkScale: 0.82 });
  await sharp(maskableFullBleedSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'maskable-icon-512x512.png'));
  console.log('✓ public/maskable-icon-512x512.png (512x512 full-bleed maskable)');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
