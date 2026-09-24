import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import * as lightningcss from 'lightningcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function unwrapLayers(css: string): string {
  let result = css.replace(/@layer\s+[\w\s,]+;/g, '');
  let pos = 0;
  while (true) {
    const match = result.indexOf('@layer', pos);
    if (match === -1) break;
    const openBrace = result.indexOf('{', match);
    if (openBrace === -1) break;
    let depth = 1;
    let idx = openBrace + 1;
    while (idx < result.length && depth > 0) {
      if (result[idx] === '{') depth++;
      else if (result[idx] === '}') depth--;
      idx++;
    }
    if (depth === 0) {
      const inside = result.substring(openBrace + 1, idx - 1);
      result = result.substring(0, match) + inside + result.substring(idx);
      pos = match;
    } else {
      break;
    }
  }
  return result;
}

function legacyCompatPlugin(): Plugin {
  return {
    name: 'legacy-compat-plugin',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        if (fileName.endsWith('.css')) {
          const chunk = bundle[fileName];
          if (chunk.type === 'asset' && typeof chunk.source === 'string') {
            try {
              const unwrapped = unwrapLayers(chunk.source);
              const res = lightningcss.transform({
                filename: fileName,
                code: Buffer.from(unwrapped),
                targets: {
                  chrome: 60 << 16,
                  safari: 12 << 16,
                  firefox: 60 << 16,
                  edge: 79 << 16,
                },
                minify: true,
              });
              chunk.source = res.code.toString();
              console.log(`[legacy-compat] Successfully transformed ${fileName} for older Android & Windows browsers.`);
            } catch (err) {
              console.error(`[legacy-compat] Error transforming ${fileName}:`, err);
            }
          }
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      legacyCompatPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'icon-maskable.svg',
          'fonts/**/*.{woff,woff2,ttf,eot}',
        ],
        manifest: {
          id: '/',
          name: 'یادمان - سامانه برنامه‌ریزی و مرور هوشمند',
          short_name: 'یادمان',
          description: 'برنامه‌ریزی و مدیریت هوشمند مرور مطالب بر اساس منحنی فراموشی هرمان ابینگهاوس',
          theme_color: '#2563eb',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          scope: './',
          dir: 'rtl',
          lang: 'fa',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,json}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) =>
                request.destination === 'style' ||
                request.destination === 'script' ||
                request.destination === 'worker',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              urlPattern: ({ request }) =>
                request.destination === 'image' ||
                request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      target: ['es2015', 'chrome60', 'edge79', 'firefox60', 'safari12'],
      cssTarget: ['chrome60', 'edge79', 'firefox60', 'safari12'],
      chunkSizeWarningLimit: 3500,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
