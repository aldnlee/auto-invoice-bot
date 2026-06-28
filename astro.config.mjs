import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Konfigurasi agar Astro berjalan dalam mode Server-Side Rendering (SSR) di Cloudflare
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});