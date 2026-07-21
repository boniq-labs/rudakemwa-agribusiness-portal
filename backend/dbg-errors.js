const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge', headless: false, slowMo: 30,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      console.log(`[CONSOLE:${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on('requestfailed', req => {
    console.log(`[REQFAIL] ${req.url()} -> ${req.failure()?.errorText || 'unknown'}`);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[RESP ${resp.status()}] ${resp.url()}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#username', 'ruda');
  await page.fill('#password', 'rdkmw@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const pages = ['/animals/cattle', '/animals/pigs', '/users', '/animals/reports'];
  for (const url of pages) {
    console.log(`\n=== ${url} ===`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
