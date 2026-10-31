import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const file = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: file('./index.html'),
        angleMystery: file('./angle-mystery.html'),
        results: file('./results.html'),
      },
    },
  },
});
