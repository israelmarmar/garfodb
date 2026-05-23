import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const textEncodingShim = new URL('./src/shims/text-encoding.ts', import.meta.url).pathname;
const webcryptoShim = new URL('./src/shims/peculiar-webcrypto.ts', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@peculiar/webcrypto': webcryptoShim,
      'text-encoding': textEncodingShim,
    },
  },
  server: {
    allowedHosts: ['6f50-2804-5f1c-89aa-300-7932-1858-6adf-5e74.ngrok-free.app'], // Not recommended for production-like environments
    port: 8900,
  },
  preview: {
    allowedHosts: ['6f50-2804-5f1c-89aa-300-7932-1858-6adf-5e74.ngrok-free.app'] // Not recommended for production-like environments
  }
});
