import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql.substring(0, 80)); } catch (e: any) { console.log('ERR:', e.message); } };
  await run("ALTER TABLE birth_records ADD COLUMN animal_id INT DEFAULT NULL AFTER weight");
  await run("ALTER TABLE birth_records ADD COLUMN deleted_at DATETIME DEFAULT NULL");
  let [r]: any = await c.query("SHOW COLUMNS FROM pregnancies");
  console.log('pregnancies:', r.map((x: any) => x.Field).join(', '));
  await c.end();
})();
