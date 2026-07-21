const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge', headless: false, slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`[PAGE_ERROR] ${err.message}\n${err.stack}`));

  // Login first
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#username', 'ruda');
  await page.fill('#password', 'rdkmw@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log('--- Logged in ---\n');

  // Navigate to the pages that might trigger the error
  const pages = ['/animals/vaccinations', '/animals/reports', '/veterinary/vaccinations'];
  for (const url of pages) {
    console.log(`\n>>> Navigating to ${url}`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
  console.log('\nDone.');
})().catch(err => { console.error(err.message); process.exit(1); });
