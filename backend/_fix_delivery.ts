import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK'); } catch (e: any) { console.log('ERR:', e.message); } };
  await run("ALTER TABLE deliveries ADD COLUMN vehicle_id INT DEFAULT NULL");
  await run("ALTER TABLE deliveries ADD COLUMN driver_id INT DEFAULT NULL");
  await c.end();
})();
