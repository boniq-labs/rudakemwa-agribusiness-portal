const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge', headless: false, slowMo: 30,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const failures = [];
  const consoleErrors = [];
  const serverErrors = [];

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      const text = msg.text();
      consoleErrors.push(`[${msg.type().toUpperCase()}] ${text}`);
      if (text.includes('ERR_INVALID_URL') || text.includes('404')) {
        console.log(`  >> CONSOLE: ${text}`);
      }
    }
  });
  page.on('pageerror', err => consoleErrors.push(`[PAGE_ERROR] ${err.message}`));
  page.on('requestfailed', req => {
    failures.push({ url: req.url(), err: req.failure()?.errorText || 'unknown' });
  });
  page.on('response', resp => {
    if (resp.status() >= 500) {
      serverErrors.push({ url: resp.url(), status: resp.status() });
    } else if (resp.status() >= 400) {
      console.log(`[${resp.status()}] ${resp.url()}`);
    }
  });

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#username', 'ruda');
  await page.fill('#password', 'rdkmw@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const allPages = [
    '/dashboard', '/users', '/animals/registration', '/animals/dashboard',
    '/animals/cattle', '/animals/pigs', '/animals/feeding', '/animals/vaccinations',
    '/animals/breeding', '/animals/weights', '/animals/births', '/animals/treatments',
    '/animals/sales', '/animals/deaths', '/animals/reports',
    '/milk/dashboard', '/milk/morning', '/milk/evening',
    '/hr/dashboard', '/hr/employees', '/hr/departments', '/hr/positions',
    '/stock/dashboard', '/stock/feed', '/stock/medicines',
    '/procurement/dashboard', '/procurement/suppliers', '/procurement/requests',
    '/logistics/dashboard', '/logistics/vehicles', '/logistics/drivers',
    '/accounting/dashboard', '/accounting/income', '/accounting/expenses',
    '/sales/dashboard', '/sales/products', '/sales/orders',
    '/veterinary/dashboard', '/veterinary/vaccinations',
    '/crops/dashboard',
  ];

  for (const url of allPages) {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 10000 });
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('  FINAL VERIFICATION RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\nFailed requests (${failures.length}):`);
  for (const f of failures) {
    console.log(`  ${f.err}: ${f.url}`);
  }
  
  console.log(`\nServer 5xx errors (${serverErrors.length}):`);
  for (const se of serverErrors) {
    console.log(`  ${se.status}: ${se.url}`);
  }
  
  console.log(`\nConsole issues (${consoleErrors.length}):`);
  for (const ce of [...new Set(consoleErrors)]) {
    console.log(`  ${ce}`);
  }
  
  const pass = failures.length === 0 && serverErrors.length === 0 && consoleErrors.length === 0;
  console.log(`\n${pass ? 'ALL CLEAN - NO ISSUES' : 'ISSUES FOUND - SEE ABOVE'}`);
  console.log('='.repeat(60));

  await browser.close();
})().catch(err => { console.error(err.message); process.exit(1); });
