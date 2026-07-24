import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { migrationStatus } from '../database/index';
dotenv.config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'efms',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  console.log('Migration status:');
  await migrationStatus(conn);

  await conn.end();
})();
