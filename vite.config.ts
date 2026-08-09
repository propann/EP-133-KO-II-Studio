import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative assets work on GitHub Pages and when the build is served locally.
  base: './',
  plugins: [react()],
  server: { proxy: { '/bridge': { target: 'http://127.0.0.1:8765', rewrite: (path) => path.replace(/^\/bridge/, '') } } },
});
