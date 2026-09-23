import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all interfaces so phones in the LAN can reach the dev server
    proxy: { '/api': 'http://localhost:4000' },
  },
});
