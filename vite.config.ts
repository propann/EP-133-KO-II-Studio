import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { appendFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const MIDI_CAPTURE_PATH = resolve(process.cwd(), 'tmp/ep133-midi-capture.ndjson');

/** Pont de diagnostic temporaire : journal local, développement uniquement.
 * À supprimer après établissement de la cartographie matérielle A–D. */
function temporaryMidiCapture(): Plugin {
  return {
    name: 'temporary-midi-capture',
    apply: 'serve' as const,
    configureServer(server) {
      server.middlewares.use('/__midi-capture', (request, response, next) => {
        if (request.method !== 'POST') { next(); return; }
        let body = '';
        request.on('data', (chunk: Buffer) => { if (body.length < 32_768) body += chunk.toString(); });
        request.on('end', () => {
          try {
            const event = JSON.parse(body) as Record<string, unknown>;
            void mkdir(resolve(process.cwd(), 'tmp'), { recursive: true })
              .then(() => appendFile(MIDI_CAPTURE_PATH, `${JSON.stringify({ capturedAt: new Date().toISOString(), ...event })}\n`))
              .then(() => { response.statusCode = 204; response.end(); })
              .catch(() => { response.statusCode = 500; response.end('capture write failed'); });
          } catch {
            response.statusCode = 400;
            response.end('invalid json');
          }
        });
      });
    },
  };
}

export default defineConfig({
  // Relative assets work on GitHub Pages and when the build is served locally.
  base: './',
  plugins: [
    react(),
    temporaryMidiCapture(),
    // Application hors ligne installable (docs/REGISTRE_IDEES.md X-12,
    // RETENU depuis longtemps, jamais implémenté avant cette intégration).
    // `autoUpdate` récupère silencieusement une nouvelle version en fond ;
    // aucune donnée machine n'est mise en cache, seulement les fichiers
    // statiques du Studio lui-même.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa/apple-touch-icon.png'],
      manifest: {
        name: 'EP-133 KO II Studio',
        short_name: 'EP-133 Studio',
        description: "Studio compagnon open source pour créer, cloner et transférer avec le Teenage Engineering EP-133 K.O. II.",
        lang: 'fr',
        theme_color: '#1A1A1A',
        background_color: '#1A1A1A',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { proxy: { '/bridge': { target: 'http://127.0.0.1:8765', rewrite: (path) => path.replace(/^\/bridge/, '') } } },
});
