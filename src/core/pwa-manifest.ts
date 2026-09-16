import type { ManifestOptions } from 'vite-plugin-pwa';

export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Markets View',
  short_name: 'Markets View',
  description: 'Comparador en tiempo real de horarios de apertura y cierre bursátil contra hora de Chile',
  theme_color: '#0f172a',
  background_color: '#090d16',
  display: 'standalone',
  orientation: 'portrait',
  icons: [
    {
      src: 'pwa-192x192.svg',
      sizes: '192x192',
      type: 'image/svg+xml'
    },
    {
      src: 'pwa-512x512.svg',
      sizes: '512x512',
      type: 'image/svg+xml'
    }
  ]
};
