const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'efms',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    waitForConnections: true, connectionLimit: 5
  });

  const [rows] = await pool.query(
    'SELECT r.slug as role, GROUP_CONCAT(p.slug) as permissions FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id LEFT JOIN permissions p ON rp.permission_id = p.id WHERE r.slug = ? GROUP BY r.id',
    ['worker']
  );
  console.log('Worker permissions:', rows[0]?.permissions || 'NONE');

  const [tables] = await pool.query("SHOW TABLES LIKE 'attendance'");
  console.log('Attendance table exists:', tables.length > 0);
  if (tables.length > 0) {
    const [cols] = await pool.query('DESCRIBE attendance');
    console.log('Attendance columns:', cols.map(c => c.Field).join(', '));
  }

  const [actTables] = await pool.query("SHOW TABLES LIKE 'employee_activities'");
  console.log('employee_activities table exists:', actTables.length > 0);

  const [emps] = await pool.query('SELECT id, user_id, employee_code, position FROM employees LIMIT 5');
  console.log('Employees:', JSON.stringify(emps));

  await pool.end();
}
main().catch(console.error);
