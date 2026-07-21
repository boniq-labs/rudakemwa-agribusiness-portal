import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql.substring(0, 80)); } catch (e: any) { console.log('ERR:', e.message); } };

  // Fix storage_tanks to include alias columns
  await run(`CREATE OR REPLACE VIEW storage_tanks AS SELECT id, tank_name as name, tank_number as code, capacity_liters, current_quantity, temperature, status, created_at, updated_at, deleted_at FROM milk_storage_tanks`);

  // Also fix stock_transactions route - check table has right columns
  let [r]: any = await c.query("SHOW COLUMNS FROM stock_transactions");
  console.log('stock_transactions:', r.map((x: any) => x.Field).join(', '));
  await c.end();
})();
