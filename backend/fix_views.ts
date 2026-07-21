import mysql from 'mysql2/promise';

async function fixViews() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.query('USE efms');

  const views: [string, string][] = [
    ['storage_tanks', 'SELECT * FROM milk_storage_tanks'],
    ['milk_waste_records', 'SELECT * FROM milk_waste'],
    ['medicines', 'SELECT * FROM medicine_items'],
    ['payroll', 'SELECT * FROM payroll_records'],
    ['sales_invoices', 'SELECT * FROM sales_invoices'],
    ['health_records', 'SELECT * FROM animal_health_records'],
    ['vaccination_schedules', 'SELECT * FROM vaccination_schedule'],
    ['inventory_categories_view', 'SELECT * FROM inventory_categories'],
  ];

  for (const [viewName, selectSql] of views) {
    try {
      // Check if it's already a table
      const [tables]: any = await conn.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='efms' AND TABLE_NAME='${viewName}'`);
      if (tables.length === 0) {
        await conn.query(`CREATE OR REPLACE VIEW \`${viewName}\` AS ${selectSql}`);
        console.log(`✓ Created view: ${viewName}`);
      } else {
        const [views]: any = await conn.query(`SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA='efms' AND TABLE_NAME='${viewName}'`);
        if (views.length === 0) {
          console.log(`→ ${viewName} is already a table, skipping`);
        } else {
          console.log(`→ ${viewName} already exists as view`);
        }
      }
    } catch (e: any) {
      console.log(`✗ ${viewName}: ${e.message}`);
    }
  }

  await conn.end();
  console.log('Views fix complete');
}

fixViews().catch(console.error);
