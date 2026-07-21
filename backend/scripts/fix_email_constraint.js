// Make email column nullable and drop unique constraint if it exists
// Run: node scripts/fix_email_constraint.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await conn.query('USE efms');

  try {
    await conn.query("ALTER TABLE users MODIFY email VARCHAR(255) DEFAULT NULL");
    console.log('Made email column nullable');
  } catch (e) {
    console.log('Could not modify email column:', e.message);
  }

  try {
    // Drop unique constraint on email (if it exists under various names)
    const [rows] = await conn.query("SHOW INDEX FROM users WHERE Column_name='email'");
    for (const row of rows) {
      if (row.Non_unique === 0) {
        await conn.query(`ALTER TABLE users DROP INDEX \`${row.Key_name}\``);
        console.log('Dropped unique index:', row.Key_name);
      }
    }
  } catch (e) {
    console.log('Could not drop index:', e.message);
  }

  // Update existing empty emails to NULL
  await conn.query("UPDATE users SET email = NULL WHERE email = ''");
  console.log('Updated empty emails to NULL');

  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
