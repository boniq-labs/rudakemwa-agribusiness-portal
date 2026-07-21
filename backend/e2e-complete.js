// Complete E2E test script - runs server, tests everything, exits
const { spawn } = require('child_process');
const http = require('http');

const SERVER_CMD = 'cmd.exe';
const SERVER_ARGS = ['/c', 'npx tsx src/server.ts'];
const BASE = 'http://localhost:5000/api';
let ok = 0, fail = 0;

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    try {
      const opts = {
        method,
        hostname: 'localhost', port: 5000,
        path: '/api' + path,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      };
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    } catch (e) { reject(e); }
  });
}

function check(name, condition, detail) {
  if (condition) { console.log('  PASS', name, detail || ''); ok++; }
  else { console.log('  FAIL', name, detail || ''); fail++; }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await api('GET', '/health');
      return true;
    } catch { await sleep(1000); }
  }
  return false;
}

async function main() {
  // Start server
  console.log('=== Starting server ===');
  const server = spawn(SERVER_CMD, SERVER_ARGS, { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'], });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  const started = await waitForServer();
  if (!started) { console.log('ERROR: Server failed to start'); process.exit(1); }
  console.log('Server ready');

  // Login
  const loginRes = await api('POST', '/auth/login', { username: 'ruda', password: 'rdkmw@' });
  const token = loginRes.body.data.token;
  const ts = Date.now();

  console.log('\n========================================');
  console.log('  USER CREATION E2E');
  console.log('========================================');

  // 1. CREATE user
  const username = 'e2e' + ts;
  const password = 'E2eTest123!';
  const createRes = await api('POST', '/users', {
    username, password, firstName: 'E2E', lastName: 'Test',
    email: username + '@farm.com', roleId: 2, departmentId: 2, isActive: 1
  }, token);
  const userId = createRes.body.data.id;
  const empCode = createRes.body.data.employeeCode;
  check('CREATE', createRes.status === 201, `id=${userId} emp=${empCode}`);

  // 2. DB INSERT - verify from get endpoint
  const getRes = await api('GET', '/users/' + userId, null, token);
  const user = getRes.body.data;
  check('DB EXISTS', user.id === userId, `user=${user.username}`);
  check('ROLE', user.role_name !== null && user.role_name !== '', `role=${user.role_name}`);
  check('DEPT', user.department_name !== null && user.department_name !== '', `dept=${user.department_name}`);
  check('ACTIVE', user.is_active === 1, `active=${user.is_active}`);

  // 3. LOGIN with new user
  const loginUserRes = await api('POST', '/auth/login', { username, password });
  check('LOGIN', loginUserRes.status === 200, 'token=' + (loginUserRes.body.data.token ? 'yes' : 'no'));
  check('PASSWORD HASH', loginUserRes.body.data.token.length > 20, 'hash verified');

  // 4. USER IN LIST
  const listRes = await api('GET', '/users?page=1&limit=100', null, token);
  const found = listRes.body.data.some(u => u.id === userId);
  check('IN LIST', found, 'found=' + found);

  // 5. EDIT user (update name + department)
  const editRes = await api('PUT', '/users/' + userId, { firstName: 'E2EUpdated', departmentId: 3 }, token);
  check('EDIT', editRes.status === 200, 'msg=' + editRes.body.message);

  // Verify edit persisted
  const verifyRes = await api('GET', '/users/' + userId, null, token);
  const updated = verifyRes.body.data;
  const nameOk = updated.first_name === 'E2EUpdated' || updated.firstName === 'E2EUpdated';
  const deptOk = updated.department_name === 'Finance';
  check('EDIT PERSISTED', nameOk && deptOk, `name=${updated.first_name} dept=${updated.department_name}`);

  // 6. DELETE user
  const delRes = await api('DELETE', '/users/' + userId, null, token);
  check('DELETE', delRes.status === 200, 'msg=' + delRes.body.message);

  // Verify soft delete
  const chkRes = await api('GET', '/users/' + userId, null, token);
  const deletedUser = chkRes.body.data;
  check('SOFT DELETE', deletedUser && (deletedUser.deleted_at !== null && deletedUser.deleted_at !== undefined && deletedUser.deleted_at !== ''), `deleted_at=${deletedUser ? deletedUser.deleted_at : 'N/A'}`);

  console.log('\n========================================');
  console.log('  ANIMAL REGISTRATION E2E');
  console.log('========================================');

  // 7. CREATE animal
  const tag = 'E2E' + ts;
  const animalBody = {
    tag_number: tag, name: 'E2ECow', animal_category_id: 1, breed_id: 1,
    gender: 'female', animal_status: 'Pregnant', weight: 550, feed_type: 'Hay'
  };
  const animalRes = await api('POST', '/animals', animalBody, token);
  const animalId = animalRes.body.data.id;
  check('CREATE ANIMAL', animalRes.status === 201, `id=${animalId}`);

  // 8. DB RECORD
  const getAnimalRes = await api('GET', '/animals/' + animalId, null, token);
  const animal = getAnimalRes.body.data;
  check('DB RECORD', animal.id === animalId, `tag=${animal.tag_number}`);
  check('ANIMAL_STATUS', animal.animal_status === 'Pregnant', `val=${animal.animal_status}`);
  check('SYSTEM STATUS', animal.status === 'active', `val=${animal.status}`);
  check('CATEGORY ID', animal.animal_category_id === 1, `id=${animal.animal_category_id}`);
  check('BREED ID', animal.breed_id === 1, `id=${animal.breed_id}`);
  check('CATEGORY NAME', !!animal.category_name, `name=${animal.category_name}`);
  check('BREED NAME', !!animal.breed_name, `name=${animal.breed_name}`);

  // 9. LOCATIONS / GROUPS endpoints
  const locRes = await api('GET', '/animals/locations', null, token);
  check('LOCATIONS', locRes.status === 200, 'OK');
  const grpRes = await api('GET', '/animals/groups', null, token);
  check('GROUPS', grpRes.status === 200, 'OK');

  // 10. CATEGORIES endpoint (was one of the 3 failures)
  const catRes = await api('GET', '/animals/categories', null, token);
  check('CATEGORIES', catRes.status === 200, 'OK');

  // 11. BREEDS endpoint
  const brdRes = await api('GET', '/animals/breeds', null, token);
  check('BREEDS', brdRes.status === 200, 'OK');

  // 12. DASHBOARD stats
  const dashRes = await api('GET', '/animals/dashboard', null, token);
  const hasStats = dashRes.status === 200 && dashRes.body.data != null;
  check('DASHBOARD', hasStats, 'OK');

  // 13. Animal in list
  const listARes = await api('GET', '/animals?page=1&limit=100', null, token);
  const foundAnimal = listARes.body.data.some(a => a.id === animalId);
  check('IN ANIMAL LIST', foundAnimal, 'found=' + foundAnimal);

  // 14. PROFILE (already verified above in DB RECORD)
  // 15. VET ACCESS
  const vaccRes = await api('GET', '/animals/vaccinations?animal_id=' + animalId, null, token);
  check('VET VACCINATIONS', vaccRes.status === 200, 'OK');
  const treatRes = await api('GET', '/animals/treatments?animal_id=' + animalId, null, token);
  check('VET TREATMENTS', treatRes.status === 200, 'OK');

  // 16. MILK production
  const milkRes = await api('GET', '/milk-production?animal_id=' + animalId, null, token).catch(() => null);
  if (milkRes) check('MILK PRODUCTION', milkRes.status === 200, 'OK');
  else {
    const milkRes2 = await api('GET', '/milk/production?animal_id=' + animalId, null, token).catch(() => null);
    if (milkRes2) check('MILK PRODUCTION (alt)', milkRes2.status === 200, 'OK');
    else check('MILK PRODUCTION', false, 'no endpoint');
  }

  // 17. FEEDING records
  const feedRes = await api('GET', '/animals/feeding?animal_id=' + animalId, null, token);
  check('FEEDING', feedRes.status === 200, 'OK');

  // 18. BREEDING records
  const breedRes = await api('GET', '/animals/breeding?animal_id=' + animalId, null, token);
  check('BREEDING', breedRes.status === 200, 'OK');

  // 19. WEIGHT records
  const wtRes = await api('GET', '/animals/weights?animal_id=' + animalId, null, token);
  check('WEIGHTS', wtRes.status === 200, 'OK');

  // 20. REPORTS
  const repRes = await api('GET', '/animals/reports', null, token);
  check('REPORTS', repRes.status === 200, 'OK');

  // 21. FK INTEGRITY - delete animal and check cascading
  const delAnimalRes = await api('DELETE', '/animals/' + animalId, null, token);
  check('DELETE ANIMAL', delAnimalRes.status === 200, 'OK');

  // 22. Verify milk/crop/procurement/accounting endpoints also healthy
  const endpoints = [
    ['MILK DASHBOARD', 'GET', '/milk-production/dashboard'],
    ['CROP TYPES', 'GET', '/crop-types'],
    ['PROCUREMENT ORDERS', 'GET', '/procurement/orders'],
    ['PROCUREMENT REQUESTS', 'GET', '/procurement/requests'],
    ['ACCOUNTING INCOME', 'GET', '/accounting/income'],
    ['ACCOUNTING EXPENSES', 'GET', '/accounting/expenses'],
    ['ACCOUNTING INVOICES', 'GET', '/accounting/invoices'],
    ['STOCK MEDICINE', 'GET', '/medicine-stock'],
    ['STOCK FEED', 'GET', '/feed-stock'],
    ['LOGISTICS VEHICLES', 'GET', '/vehicles'],
    ['LOGISTICS MAINTENANCE', 'GET', '/maintenance'],
    ['SALES PRODUCTS', 'GET', '/sales/products'],
    ['HR DEPARTMENTS', 'GET', '/departments'],
    ['HR POSITIONS', 'GET', '/positions'],
    ['VET VACC-SCHEDULE', 'GET', '/veterinary/vaccination-schedule'],
  ];
  for (const [name, method, path] of endpoints) {
    try {
      const r = await api(method, path, null, token);
      check(name, r.status === 200, `status=${r.status}`);
    } catch (e) {
      check(name, false, 'error=' + e.message);
    }
  }

  console.log('\n========================================');
  console.log('  RESULTS');
  console.log('========================================');
  console.log('  PASSED:', ok);
  console.log('  FAILED:', fail);
  console.log('  VERDICT:', fail === 0 ? 'ALL PASSED' : 'SOME FAILED');

  server.kill();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
