const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host:'localhost', user:'root', password:'' });
  await c.query('USE efms');
  const [roles] = await c.query('SELECT id,slug FROM roles');
  const worker = roles.find(r => r.slug === 'worker');
  if (!worker) { console.log('Worker role not found'); process.exit(1); }
  const [perms] = await c.query(
    `SELECT id,slug FROM permissions WHERE slug LIKE 'attendance.%' OR slug LIKE 'users.%'`
  );
  for (const p of perms) {
    await c.query('INSERT IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)', [worker.id, p.id]);
    console.log('  Added:', p.slug);
  }
  console.log('Worker permissions updated -', perms.length, 'permissions added');
  await c.end();
})();
