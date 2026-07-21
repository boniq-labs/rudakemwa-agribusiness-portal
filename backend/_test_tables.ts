import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  async function exists(table: string) {
    let [r]: any = await c.query("SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='efms' AND TABLE_NAME=?", [table]);
    console.log(table + ':', (r[0] as any).cnt > 0 ? 'EXISTS' : 'MISSING');
  }
  await exists('inventory_items');
  await exists('inventory_categories');
  await exists('stock_transactions');
  await exists('milk_storage');

  // Check milk_storage columns
  let [r2]: any = await c.query("SHOW COLUMNS FROM milk_storage");
  console.log('milk_storage columns:', r2.map((x: any) => x.Field).join(', '));
  await c.end();
})();
