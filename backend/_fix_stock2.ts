import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql.substring(0, 80)); } catch (e: any) { console.log('ERR:', e.message); } };

  await run("ALTER TABLE stock_transactions ADD COLUMN supplier_id INT DEFAULT NULL");
  await run("ALTER TABLE stock_transactions ADD COLUMN department_id INT DEFAULT NULL");
  await run("ALTER TABLE stock_transactions ADD COLUMN from_location_id INT DEFAULT NULL");
  await run("ALTER TABLE stock_transactions ADD COLUMN to_location_id INT DEFAULT NULL");
  console.log('Done');
  await c.end();
})();
