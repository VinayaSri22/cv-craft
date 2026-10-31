import puppeteer from 'puppeteer';

export class PdfBusyError extends Error {
  constructor() {
    super('PDF renderer is busy. Try again in a moment.');
    this.code = 'PDF_BUSY';
  }
}

export class PdfUnavailableError extends Error {
  constructor(cause) {
    super('PDF rendering is unavailable on the server right now.');
    this.code = 'PDF_UNAVAILABLE';
    this.cause = cause;
  }
}

export class PdfTimeoutError extends Error {
  constructor() {
    super('PDF rendering timed out.');
    this.code = 'PDF_TIMEOUT';
  }
}

/**
 * Prints HTML to PDF with one shared headless Chromium. Each job gets its own
 * page with JavaScript disabled and all network requests blocked; resume HTML
 * is fully self-contained, so nothing it references can reach the network.
 */
export class PdfPrinter {
  /**
   * @param {{ concurrency?: number, maxQueue?: number, timeoutMs?: number, launchOptions?: object }} [opts]
   */
  constructor({ concurrency = 3, maxQueue = 20, timeoutMs = 15_000, launchOptions = {} } = {}) {
    this.concurrency = concurrency;
    this.maxQueue = maxQueue;
    this.timeoutMs = timeoutMs;
    this.launchOptions = launchOptions;
    this.active = 0;
    this.queue = [];
    this.browserPromise = null;
  }

  /** @param {string} html @returns {Promise<Uint8Array>} */
  async print(html) {
    await this.acquire();
    try {
      return await this.withTimeout(this.render(html));
    } finally {
      this.release();
    }
  }

  async close() {
    const browser = await this.browserPromise?.catch(() => null);
    this.browserPromise = null;
    await browser?.close();
  }

  async render(html) {
    const browser = await this.browser();
    const page = await browser.newPage();
    try {
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('data:') || url === 'about:blank') request.continue();
        else request.abort();
      });
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluateHandle('document.fonts.ready').catch(() => {});
      return await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } finally {
      await page.close().catch(() => {});
    }
  }

  browser() {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({ headless: true, ...this.launchOptions })
        .then((browser) => {
          browser.on('disconnected', () => {
            this.browserPromise = null;
          });
          return browser;
        })
        .catch((error) => {
          this.browserPromise = null;
          throw new PdfUnavailableError(error);
        });
    }
    return this.browserPromise;
  }

  withTimeout(promise) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new PdfTimeoutError()), this.timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  acquire() {
    if (this.active < this.concurrency) {
      this.active++;
      return Promise.resolve();
    }
    if (this.queue.length >= this.maxQueue) return Promise.reject(new PdfBusyError());
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release() {
    const next = this.queue.shift();
    if (next) next();
    else this.active--;
  }
}
