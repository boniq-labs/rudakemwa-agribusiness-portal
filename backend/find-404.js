const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge', headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('requestfailed', req => {
    console.log(`REQUEST_FAILED: ${req.url()} error=${req.failure()?.errorText}`);
  });
  page.on('response', resp => {
    if (resp.status() === 404) {
      console.log(`404: ${resp.url()}`);
    }
  });

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#username', 'ruda');
  await page.fill('#password', 'rdkmw@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Visit cattle page (where ERR_INVALID_URL happened)
  await page.goto(`${BASE_URL}/animals/cattle`, { waitUntil: 'networkidle', timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})().catch(err => { console.error(err.message); process.exit(1); });
