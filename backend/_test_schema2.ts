import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  let [r]: any = await c.query("SHOW TABLES LIKE '%milk%'");
  console.log('Milk tables:', r.map((x: any) => Object.values(x)[0]));
  let [r2]: any = await c.query("SHOW TABLES LIKE '%process%'");
  console.log('Process tables:', r2.map((x: any) => Object.values(x)[0]));
  let [r3]: any = await c.query("SHOW TABLES LIKE '%waste%'");
  console.log('Waste tables:', r3.map((x: any) => Object.values(x)[0]));
  await c.end();
})();
