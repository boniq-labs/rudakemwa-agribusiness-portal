import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  let [r]: any = await c.query("SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA='efms' AND TABLE_NAME LIKE '%storage%'");
  r.forEach((x: any) => console.log(x.TABLE_NAME, x.TABLE_TYPE));
  await c.end();
})();
