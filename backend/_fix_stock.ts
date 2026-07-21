import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql); } catch (e: any) { console.log('ERR:', e.message); } };

  // Create view for stock_transactions with transaction_type alias
  // The controller uses transaction_type but table has type
  await run("CREATE OR REPLACE VIEW stock_transactions_view AS SELECT id, item_id, `type` as transaction_type, quantity, unit_price, total_price, notes, created_by, created_at, deleted_at FROM stock_transactions");

  // Fix the controller to use the view
  // Actually let me just fix the controller directly instead
  console.log('Use controller fix instead');
  await c.end();
})();
