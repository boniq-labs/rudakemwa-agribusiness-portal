import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql.substring(0, 80)); } catch (e: any) { console.log('ERR:', e.message); } };

  // Add deleted_at to tables that don't have it
  await run("ALTER TABLE milk_storage_tanks ADD COLUMN deleted_at DATETIME DEFAULT NULL");
  await run("ALTER TABLE milk_waste ADD COLUMN deleted_at DATETIME DEFAULT NULL");
  await run("ALTER TABLE milk_waste ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  await run("ALTER TABLE milk_waste ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  // Add user_agent column to activity_logs
  await run("ALTER TABLE activity_logs ADD COLUMN user_agent VARCHAR(500) DEFAULT NULL");

  // Fix storage_tanks view to include deleted_at
  await run("CREATE OR REPLACE VIEW storage_tanks AS SELECT * FROM milk_storage_tanks");

  // Create view for milk_processing_records (controller uses this name)
  await run("CREATE OR REPLACE VIEW milk_processing_records AS SELECT * FROM milk_processing");

  // Fix milk_waste_records view
  await run("CREATE OR REPLACE VIEW milk_waste_records AS SELECT * FROM milk_waste");

  console.log('Done');
  await c.end();
})();
