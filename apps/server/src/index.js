import { createApp } from './app.js';
import { openDatabase, defaultDatabasePath } from './db/database.js';
import { DEFAULT_ORIGINS } from './http/origin.js';
import { createRateLimiter } from './http/rateLimit.js';
import { PdfPrinter } from './pdf/PdfPrinter.js';
import { loadRenderer } from './render/loadRenderer.js';

const port = Number(process.env.PORT ?? 3001);
const databasePath = defaultDatabasePath();
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = openDatabase(databasePath);
const renderer = await loadRenderer();
const printer = new PdfPrinter({
  concurrency: Number(process.env.PDF_CONCURRENCY ?? 3),
});
const app = createApp({
  db,
  renderer,
  printer,
  allowedOrigins,
  secureCookies: process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production',
  rateLimit: createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 }),
});

const server = app.listen(port, () => {
  console.log(`cv-craft API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  db.close();
  await Promise.allSettled([printer.close(), renderer.close()]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
