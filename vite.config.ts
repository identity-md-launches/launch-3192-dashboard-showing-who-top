import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset URL relative, so the export works under an IPFS gateway subpath.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, assetsDir: 'assets' },
});
