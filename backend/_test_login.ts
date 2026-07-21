import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  try {
    const [r]: any = await c.query(
      `SELECT u.*, r.slug as role, r.name as role_name, d.name as department_name FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN departments d ON u.department_id = d.id WHERE (u.username = ? OR u.email = ?) AND u.deleted_at IS NULL`,
      ['owner', 'owner']
    );
    console.log('Found:', r.length);
    if (r.length > 0) {
      console.log('User:', JSON.stringify({ id: r[0].id, username: r[0].username, role: r[0].role }));
    }
  } catch (e: any) { console.log('Error:', e.message); }
  await c.end();
})();
