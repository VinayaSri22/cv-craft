import { fileURLToPath } from 'node:url';

const serverRoot = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Production: imports the prebuilt renderer (`npm run build -w @cv-craft/server`).
 * Development: loads the source through Vite on every call, so template edits
 * show up in the next PDF without restarting the server.
 *
 * @returns {Promise<{ renderResume: (profile: object, settings: object) => Promise<{ html: string, title: string }>, close: () => Promise<void> }>}
 */
export async function loadRenderer({ production = process.env.NODE_ENV === 'production' } = {}) {
  if (production) {
    const mod = await import('../../dist/render/renderResume.js');
    return { renderResume: async (...args) => mod.renderResume(...args), close: async () => {} };
  }

  const { createServer } = await import('vite');
  const vite = await createServer({
    root: serverRoot,
    configFile: `${serverRoot}/vite.config.js`,
    appType: 'custom',
    logLevel: 'warn',
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  return {
    renderResume: async (...args) => {
      const mod = await vite.ssrLoadModule('/src/render/renderResume.jsx');
      return mod.renderResume(...args);
    },
    close: () => vite.close(),
  };
}
