import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  let [r]: any = await c.query("SHOW COLUMNS FROM inventory_items");
  console.log('inventory_items:', r.map((x: any) => x.Field).join(', '));
  let [r2]: any = await c.query("SHOW COLUMNS FROM stock_transactions");
  console.log('stock_transactions:', r2.map((x: any) => x.Field).join(', '));
  await c.end();
})();
