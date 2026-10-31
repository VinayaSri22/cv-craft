const { join } = require('node:path');

/** Keeps Puppeteer's Chromium inside the repo so install and runtime always agree on its location. */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
