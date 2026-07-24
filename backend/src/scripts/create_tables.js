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

  // Create employee_activities table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      date DATE NOT NULL,
      task_description TEXT,
      issue_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('employee_activities table created/confirmed');

  // Check if user_id column exists in attendance (frontend sends user_id sometimes)
  const [cols] = await pool.query('DESCRIBE attendance');
  const hasUserId = cols.some((c) => c.Field === 'user_id');
  if (!hasUserId) {
    console.log('Adding user_id column to attendance...');
    await pool.query('ALTER TABLE attendance ADD COLUMN user_id INT NULL AFTER employee_id');
    console.log('Added user_id column to attendance');
  } else {
    console.log('user_id column already exists in attendance');
  }

  // Verify worker has attendance permissions
  const [perms] = await pool.query(
    'SELECT p.slug FROM permissions p WHERE p.slug IN (?, ?)',
    ['attendance.create', 'attendance.update']
  );
  console.log('Available attendance permissions:', perms.map(p => p.slug).join(', '));

  await pool.end();
  console.log('Done!');
}
main().catch(console.error);
