import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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
  plugins: [react(), temporaryMidiCapture()],
  server: { proxy: { '/bridge': { target: 'http://127.0.0.1:8765', rewrite: (path) => path.replace(/^\/bridge/, '') } } },
});
