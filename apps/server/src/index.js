import { createApp } from './app.js';
import { PdfPrinter } from './pdf/PdfPrinter.js';
import { loadRenderer } from './render/loadRenderer.js';

const port = Number(process.env.PORT ?? 3001);

const renderer = await loadRenderer();
const printer = new PdfPrinter({
  concurrency: Number(process.env.PDF_CONCURRENCY ?? 3),
});
const app = createApp({ renderer, printer });

const server = app.listen(port, () => {
  console.log(`cv-craft API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await Promise.allSettled([printer.close(), renderer.close()]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
