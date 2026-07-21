const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5173';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge', headless: false, slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Track ALL network requests
  const failed = [];
  const serverErrors = [];

  page.on('requestfailed', req => {
    failed.push({ url: req.url(), err: req.failure()?.errorText || 'unknown' });
  });

  page.on('response', resp => {
    if (resp.status() >= 500) {
      serverErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log(`[PAGE_ERROR] ${err.message}`));

  const pages = [
    '/', '/users', '/animals/registration', '/animals/dashboard', '/animals/cattle',
    '/animals/pigs', '/animals/feeding', '/animals/vaccinations', '/animals/breeding',
    '/animals/weights', '/animals/births', '/animals/treatments', '/animals/sales',
    '/animals/deaths', '/animals/reports', '/dashboard',
    '/milk/dashboard', '/hr/dashboard', '/stock/dashboard',
    '/procurement/dashboard', '/logistics/dashboard', '/accounting/dashboard',
    '/sales/dashboard', '/veterinary/dashboard', '/crops/dashboard',
    '/hr/employees', '/hr/departments', '/hr/positions',
    '/milk/morning', '/milk/evening',
    '/stock/feed', '/stock/medicines',
    '/procurement/suppliers', '/procurement/requests',
    '/logistics/vehicles', '/logistics/drivers',
    '/accounting/income', '/accounting/expenses',
    '/sales/products', '/sales/orders',
  ];

  // Login first
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#username', 'ruda');
  await page.fill('#password', 'rdkmw@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await sleep(2000);
  console.log('\n--- Logged in. Now scanning all pages ---\n');

  for (const url of pages) {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`\n>>> Navigating to ${url}`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      console.log(`  NAV FAIL: ${e.message}`);
    }
    await sleep(1000);
  }

  console.log('\n\n============ DIAGNOSTIC RESULTS ============');
  console.log(`\n=== FAILED NETWORK REQUESTS (${failed.length}) ===`);
  for (const f of failed) {
    console.log(`  ${f.err}: ${f.url}`);
  }

  console.log(`\n=== SERVER 5xx ERRORS (${serverErrors.length}) ===`);
  for (const se of serverErrors) {
    console.log(`  ${se.status}: ${se.url}`);
  }

  await browser.close();
  console.log('\nDone.');
})().catch(err => { console.error(err.message); process.exit(1); });
