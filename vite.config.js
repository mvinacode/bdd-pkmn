import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Base relative : le site est servi par GitHub Pages sous /bdd-pkmn/,
// et les pages se redirigent entre elles par des liens relatifs.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index:   resolve(import.meta.dirname, 'index.html'),
        journal: resolve(import.meta.dirname, 'journal.html'),
        login:   resolve(import.meta.dirname, 'login.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
