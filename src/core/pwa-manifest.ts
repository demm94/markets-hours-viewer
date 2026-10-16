import type { ManifestOptions } from 'vite-plugin-pwa';

export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Markets View',
  short_name: 'Markets View',
  description: 'Comparador en tiempo real de horarios de apertura y cierre bursátil contra hora de Chile',
  theme_color: '#05060a',
  background_color: '#05060a',
  display: 'standalone',
  icons: [
    {
      src: 'pwa-192x192.svg',
      sizes: '192x192',
      type: 'image/svg+xml',
      purpose: 'any'
    },
    {
      src: 'pwa-512x512.svg',
      sizes: '512x512',
      type: 'image/svg+xml',
      purpose: 'any'
    },
    {
      src: 'pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: 'pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: 'maskable-icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
};
