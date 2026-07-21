import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  let [r]: any = await c.query("SHOW TABLES LIKE '%job%'");
  console.log('Job tables:', r.map((x: any) => Object.values(x)[0]));
  let [r2]: any = await c.query("SHOW COLUMNS FROM birth_records");
  console.log('birth_records:', r2.map((x: any) => x.Field).join(', '));
  await c.end();
})();
