import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const [r]: any = await c.query('SHOW COLUMNS FROM users');
  r.forEach((x: any) => console.log(x.Field));
  await c.end();
})();
