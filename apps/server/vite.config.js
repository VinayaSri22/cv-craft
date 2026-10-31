import { defineConfig } from 'vite';

/**
 * Builds the template renderer for production. Templates are JSX and import
 * CSS with `?inline`, which plain Node cannot load; in development the server
 * loads the same entry through Vite instead (see src/render/loadRenderer.js).
 */
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  ssr: {
    noExternal: [/^@cv-craft\//],
  },
  build: {
    ssr: 'src/render/renderResume.jsx',
    outDir: 'dist/render',
    emptyOutDir: true,
    target: 'node20',
  },
});
