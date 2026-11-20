import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaManifest } from './src/core/pwa-manifest';

function msciEmDevApiPlugin(): Plugin {
  return {
    name: 'msci-em-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (pathname !== '/api/msci-em') {
          next();
          return;
        }

        try {
          const mod = await import('./netlify/functions/msci-em.mjs');
          const request = new Request(`http://localhost${req.url || '/api/msci-em'}`, {
            method: req.method || 'GET'
          });
          const response = await mod.default(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          if (req.method === 'HEAD' || response.status === 204) {
            res.end();
            return;
          }
          const body = await response.text();
          res.end(body);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: 'DEV_PROXY_ERROR',
              message: error instanceof Error ? error.message : 'Unknown dev proxy error'
            })
          );
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    msciEmDevApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png'
      ],
      manifest: pwaManifest,
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          luxon: ['luxon'],
          motion: ['framer-motion']
        }
      }
    }
  }
});
