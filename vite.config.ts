import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync('.generated/pages.json', 'utf8')) as { url: string }[];
export default defineConfig({
  build: {
    rollupOptions: {
      input: ['index.html', 'brand.html', '404.html', ...pages.map(({ url }) => '.' + url + (url.endsWith('/') ? 'index.html' : ''))],
    },
  },
});
