import mysql from 'mysql2/promise';
import { comparePassword } from './src/utils/helpers';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const [r]: any = await c.query('SELECT password FROM users WHERE username = ?', ['owner']);
  console.log('Hash:', r[0]?.password?.substring(0, 30));
  const valid = await comparePassword('admin123', r[0].password);
  console.log('Valid:', valid);
  await c.end();
})();
