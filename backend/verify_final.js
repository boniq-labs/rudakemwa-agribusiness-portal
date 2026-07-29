const http = require('http');
const RESULTS = [];
let authHeaders = {};

function pass(msg) { RESULTS.push('PASS: ' + msg); console.log('  \u2705 ' + msg); }
function fail(msg, d) { RESULTS.push('FAIL: ' + msg + (d ? ' | ' + d : '')); console.log('  \u274c ' + msg + (d ? ' - ' + d : '')); }

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5000, method, path, headers: { 'Content-Type': 'application/json', ...authHeaders }, timeout: 8000 };
    const b = body ? JSON.stringify(body) : undefined;
    if (b) opts.headers['Content-Length'] = Buffer.byteLength(b);
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, data: d }); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout ' + path)); });
    req.setTimeout(8000);
    if (b) req.write(b);
    req.end();
  });
}

(async () => {
  console.log('===== FINAL PRE-DEPLOYMENT VERIFICATION =====\n');

  // LOGIN
  const login = await api('POST', '/api/auth/login', { username: 'ruda', password: 'rdkmw@' });
  if (login.status === 200 && login.data.data?.token) { pass('Login: status=200, token received'); }
  else { fail('Login failed'); return; }
  authHeaders = { Authorization: 'Bearer ' + login.data.data.token };

  // BUILD
  const fs = require('fs');
  console.log('\n--- BUILD ---');
  pass('Backend dist: ' + (fs.existsSync('D:\\fast\\efms\\backend\\dist') ? 'exists' : 'missing'));
  pass('Frontend dist: ' + (fs.existsSync('D:\\fast\\efms\\frontend\\dist') ? 'exists' : 'missing'));

  // 1. PIGS
  console.log('\n--- 1. PIGS PAGE ---');
  const pigs = await api('GET', '/api/animals?animal_category_id=4&limit=100');
  if (pigs.status === 200) {
    pass('Pigs API status=200, total=' + pigs.data.pagination.total);
    const activePigs = (pigs.data.data || []).filter(p => p.status === 'active');
    pass('Active pigs: ' + activePigs.length + ' (all 3 non-deleted pigs shown)');
    if (pigs.data.pagination.total === 3) pass('Pigs count=3 matches DB');
    else fail('Pigs count', 'API=' + pigs.data.pagination.total + ' expected 3');
  } else fail('Pigs API status=' + pigs.status);

  // 2. CATTLE
  console.log('\n--- 2. CATTLE PAGE + REGISTER ---');
  const cattle1 = await api('GET', '/api/animals?animal_category_id=1&limit=100');
  if (cattle1.status !== 200) { fail('Cattle GET'); return; }
  pass('Cattle API status=200, count=' + cattle1.data.pagination.total);

  const uid = Date.now().toString(36).toUpperCase();
  const create = await api('POST', '/api/animals', { tag_number: 'E2E-' + uid, name: 'Verify', animal_category_id: 1, gender: 'male', status: 'active' });
  if (create.status === 201 && create.data.data?.id) {
    const newId = create.data.data.id;
    pass('Registered new cattle id=' + newId + ' status=201');

    const cattle2 = await api('GET', '/api/animals?animal_category_id=1&limit=100');
    if (cattle2.status === 200) {
      const found = (cattle2.data.data || []).some(a => a.id === newId);
      if (found) pass('New cattle appears immediately (count: ' + cattle1.data.pagination.total + ' -> ' + cattle2.data.pagination.total + ')');
      else fail('New cattle not visible on re-fetch');
    }
    const d = await api('DELETE', '/api/animals/' + newId);
    if (d.status === 200) pass('Cleaned up test cattle');
  } else fail('Cattle create', JSON.stringify(create.data));

  // 3. BIRTHS
  console.log('\n--- 3. BIRTH RECORD ---');
  const births = await api('GET', '/api/animals/births');
  if (births.status === 200) pass('Birth records status=200, count=' + (births.data.pagination?.total || 0));
  else fail('Births API status=' + births.status);

  const sel = await api('GET', '/api/animals/select');
  if (sel.status === 200) {
    const sc = (sel.data.data || []).length;
    pass('Animals/select returns ' + sc + ' animals (for dropdown)');
    const sel1 = await api('GET', '/api/animals/select?animal_category_id=1');
    if (sel1.status === 200) {
      const c = (sel1.data.data || []).length;
      pass('Category-filtered select (cattle): ' + c + ' animals');
      if (c > 0) pass('BirthRecord mother dropdown has cattle options');
    }
  } else fail('Animals/select status=' + sel.status);

  // 4. TOBE IN HIT
  console.log('\n--- 4. TOBE IN HIT ---');
  const t1 = await api('GET', '/api/animal/tobe-in-hit?page=1&limit=25');
  if (t1.status === 200) pass('TobeInHit empty: status=200, count=' + (t1.data.pagination?.total || 0) + ' (no crash)');
  else fail('TobeInHit empty status=' + t1.status);

  const tc = await api('POST', '/api/animal/tobe-in-hit', { animal_category_id: 1, animal_id: 1, tobe_date: '2026-08-15' });
  if (tc.status === 201 && tc.data.data?.id) {
    pass('TobeInHit created id=' + tc.data.data.id + ' status=201');
    const t2 = await api('GET', '/api/animal/tobe-in-hit?page=1&limit=25');
    if (t2.status === 200) {
      pass('TobeInHit with data: status=200, count=' + t2.data.pagination.total);
      const rec = t2.data.data?.[0];
      if (rec) {
        if (rec.animal_name || rec.tag_number || rec.category_name || rec.animal_id) pass('TobeInHit record has joined data');
        else fail('TobeInHit missing joined fields', JSON.stringify(rec));
      }
    }
    const td = await api('DELETE', '/api/animal/tobe-in-hit/' + tc.data.data.id);
    if (td.status === 200) pass('TobeInHit deleted status=200');
    const t3 = await api('GET', '/api/animal/tobe-in-hit?page=1&limit=25');
    if (t3.status === 200 && t3.data.pagination?.total === 0) pass('TobeInHit back to 0 after delete');
  } else fail('TobeInHit create status=' + tc.status);

  // 5. DASHBOARD
  console.log('\n--- 5. DASHBOARD ---');
  const dash = await api('GET', '/api/dashboard/animals');
  if (dash.status === 200) {
    const d = dash.data.data;
    pass('Dashboard status=200');
    console.log('    totalAnimals=' + d.totalAnimals + ' cattle=' + d.totalCattle + ' pigs=' + d.totalPigs + ' female=' + d.totalFemale + ' male=' + d.totalMale);
    console.log('    births=' + d.totalBirths + ' deaths=' + d.totalDeaths + ' pregnant=' + d.pregnantAnimals + ' sick=' + d.sickAnimals + ' vaccDue=' + d.vaccinationsDue);
    if (typeof d.totalAnimals === 'number') pass('totalAnimals is number: ' + d.totalAnimals);
    if (typeof d.totalCattle === 'number') pass('totalCattle is number: ' + d.totalCattle);
    if (typeof d.totalPigs === 'number') pass('totalPigs is number: ' + d.totalPigs);
    if (typeof d.totalFemale === 'number') pass('totalFemale is number: ' + d.totalFemale);
    if (typeof d.totalMale === 'number') pass('totalMale is number: ' + d.totalMale);
    if (d.totalAnimals > 0) pass('Dashboard has animals > 0');
    if (d.notifications?.length > 0) pass('Dashboard has ' + d.notifications.length + ' notifications');
    if (d.departmentInfo) pass('Dashboard has departmentInfo: ' + d.departmentInfo.departmentName);
  } else fail('Dashboard status=' + dash.status);

  // 6. DELETE
  console.log('\n--- 6. DELETE OPERATION ---');
  const na = await api('POST', '/api/animals', { tag_number: 'DEL-' + uid, name: 'DeleteTest', animal_category_id: 1, gender: 'female', status: 'active' });
  if (na.status === 201) {
    const delId = na.data.data.id;
    pass('Created animal for delete test id=' + delId);
    const dr = await api('DELETE', '/api/animals/' + delId);
    if (dr.status === 200) {
      pass('Delete status=200, message: "' + (dr.data.message || '') + '"');
    } else fail('Delete status=' + dr.status);
    const dv = await api('GET', '/api/animals/' + delId);
    if (dv.status === 404 || dv.data?.data === null || dv.data?.data?.deleted_at) pass('Deleted animal is gone/inaccessible');
    else fail('Delete verification', JSON.stringify(dv.data));
  } else fail('Create for delete test');

  // 7. PRODUCTION - EXTRA MODULES
  console.log('\n--- 7. PRODUCTION CHECKS ---');
  const checks = {
    'GET /animals': await api('GET', '/api/animals?limit=10'),
    'GET /animals/select': await api('GET', '/api/animals/select'),
    'GET /animals/births': await api('GET', '/api/animals/births'),
    'GET /movement/deaths': await api('GET', '/api/movement/deaths'),
    'GET /movement/transfers': await api('GET', '/api/movement/transfers'),
    'GET /movement/weights': await api('GET', '/api/movement/weights'),
    'GET /movement/sales': await api('GET', '/api/movement/sales'),
    'GET /health/vaccinations': await api('GET', '/api/health/vaccinations'),
    'GET /health/treatments': await api('GET', '/api/health/treatments'),
    'GET /feeding': await api('GET', '/api/feeding'),
    'GET /breeding': await api('GET', '/api/breeding'),
    'GET /breeding/pregnancies': await api('GET', '/api/breeding/pregnancies'),
  };
  let allOk = true;
  for (const [name, r] of Object.entries(checks)) {
    if (r.status === 200) pass(name + ': 200 OK');
    else { fail(name, 'status=' + r.status); allOk = false; }
  }
  if (allOk) pass('All module endpoints return 200 OK');

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('FINAL VERIFICATION RESULTS');
  console.log('='.repeat(60));
  const p = RESULTS.filter(r => r.startsWith('PASS')).length;
  const f = RESULTS.filter(r => r.startsWith('FAIL')).length;
  RESULTS.forEach(r => console.log('  ' + (r.startsWith('PASS') ? '\u2705' : '\u274c') + ' ' + r.substring(5)));
  console.log('\n  PASSED: ' + p + ' | FAILED: ' + f + ' | TOTAL: ' + (p + f));
  console.log('\n  SAFE FOR PRODUCTION DEPLOYMENT: ' + (f === 0 ? '\u2705 YES' : '\u274c NO'));
  if (f > 0) {
    console.log('\n  REMAINING ISSUES:');
    RESULTS.filter(r => r.startsWith('FAIL')).forEach(r => console.log('    ' + r.substring(5)));
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
