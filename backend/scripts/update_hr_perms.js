// Adds users module permissions to the HR role
// Run: node scripts/update_hr_perms.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await conn.query('USE efms');

  const [role] = await conn.query('SELECT id FROM roles WHERE slug = ?', ['hr']);
  if (role.length === 0) { console.log('HR role not found'); process.exit(0); }

  const actions = ['view', 'create', 'update', 'delete', 'approve', 'export'];
  let count = 0;
  for (const action of actions) {
    const [perm] = await conn.query('SELECT id FROM permissions WHERE slug = ?', [`users.${action}`]);
    if (perm.length > 0) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [role[0].id, perm[0].id]);
      count++;
    }
  }
  console.log(`Added ${count} users module permissions to HR role`);
  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
