import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['garfo'],
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      garfo: fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      buffer: fileURLToPath(new URL('./node_modules/buffer/index.js', import.meta.url)),
      crypto: fileURLToPath(new URL('./src/crypto-shim.ts', import.meta.url)),
      events: fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
      process: fileURLToPath(new URL('./node_modules/process/browser.js', import.meta.url)),
      'text-encoding': fileURLToPath(new URL('./node_modules/text-encoding/index.js', import.meta.url)),
      util: fileURLToPath(new URL('./node_modules/util/util.js', import.meta.url)),
      '@peculiar/webcrypto': fileURLToPath(new URL('./node_modules/@peculiar/webcrypto/build/webcrypto.js', import.meta.url)),
    },
  },
  server: {
    allowedHosts: true,
    port: 3000,
    fs: {
      allow: ['..'],
    },
  },
});
