require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await c.query('USE efms');
  await c.query(`CREATE TABLE IF NOT EXISTS daily_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    report_date DATE NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    status ENUM('draft','submitted','approved','rejected') DEFAULT 'submitted',
    manager_comment TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  )`);
  console.log('daily_reports table created successfully');
  await c.end();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
