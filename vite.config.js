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
    // Le site importe Supabase par URL figée (cf. js/supabase-client.js) ; en test
    // cette URL pointe vers le même paquet installé en devDependency.
    alias: {
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm': '@supabase/supabase-js',
    },
  },
});
