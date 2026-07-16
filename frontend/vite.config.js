import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The local workspace dependency can otherwise cause Vite to load two
  // React copies, which breaks hooks when navigating between routes.
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    host: true
  }
});
