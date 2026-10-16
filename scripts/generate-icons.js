import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');
const svgBuffer = fs.readFileSync(SVG_PATH);

async function generate() {
  console.log('Generating PWA raster icons from SVG...');

  // 1. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png (180x180)');

  // 2. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
  console.log('✓ public/pwa-192x192.png (192x192)');

  // 3. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
  console.log('✓ public/pwa-512x512.png (512x512)');

  // 4. maskable-icon-512x512.png (with 10% safe zone padding on background #05060a)
  const innerIconSize = Math.round(512 * 0.8); // 410px inner content
  const innerIcon = await sharp(svgBuffer)
    .resize(innerIconSize, innerIconSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 6, b: 10, alpha: 1 }
    }
  })
    .composite([
      {
        input: innerIcon,
        top: Math.round((512 - innerIconSize) / 2),
        left: Math.round((512 - innerIconSize) / 2)
      }
    ])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'maskable-icon-512x512.png'));
  console.log('✓ public/maskable-icon-512x512.png (512x512 maskable)');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
