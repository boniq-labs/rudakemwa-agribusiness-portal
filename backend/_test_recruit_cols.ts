import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  let [r]: any = await c.query("SHOW COLUMNS FROM recruitment_jobs");
  console.log('recruitment_jobs:', r.map((x: any) => x.Field).join(', '));
  await c.end();
})();
