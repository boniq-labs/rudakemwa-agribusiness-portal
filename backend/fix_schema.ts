import mysql from 'mysql2/promise';

async function fixSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.query('USE efms');

  const tables = [
    'animal_categories', 'breeds', 'breeding_records', 'pregnancies', 'birth_records',
    'vaccinations', 'diseases', 'treatments', 'feeding_records', 'weight_records',
    'animal_transfers', 'animal_purchases', 'animal_sales', 'animal_deaths',
    'milk_collections', 'stock_locations', 'leave_types',
    'purchase_requests', 'purchase_orders', 'suppliers', 'supplier_categories',
    'purchase_request_items', 'purchase_order_items', 'quotations', 'quotation_items',
    'goods_receipts', 'supplier_invoices', 'supplier_contracts',
    'vehicle_types', 'milk_quality_tests', 'milk_storage', 'milk_processing', 'milk_products',
    'stock_transactions', 'stock_issues', 'stock_issue_items', 'stock_transfers', 'stock_adjustments',
    'feed_items', 'medicine_items', 'equipment', 'equipment_maintenance',
    'stock_audits', 'stock_audit_items',
    'transport_requests', 'transport_approvals', 'trips', 'deliveries', 'delivery_items',
    'fuel_records', 'vehicle_maintenance', 'logistics_expenses',
    'income_records', 'expense_records', 'expense_categories',
    'invoices', 'invoice_items', 'receipts', 'payments', 'payroll_records', 'payroll_items',
    'budgets', 'budget_items', 'tax_records', 'transactions',
    'customers', 'product_categories', 'products', 'sales_orders', 'sales_order_items',
    'customer_payments', 'sales_returns', 'sales_return_items',
    'animal_health_records', 'vaccination_schedule', 'vaccination_records', 'treatment_prescriptions',
  ];

  for (const t of tables) {
    try {
      await conn.query(`ALTER TABLE \`${t}\` ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`);
      console.log(`✓ ${t}`);
    } catch (e: any) {
      console.log(`✗ ${t}: ${e.message}`);
    }
  }

  // Create locations view
  try {
    await conn.query('DROP VIEW IF EXISTS locations');
    await conn.query(`CREATE VIEW locations AS SELECT id, name, 'animal' as loc_type FROM animal_locations UNION ALL SELECT id, name, 'stock' as loc_type FROM stock_locations`);
    console.log('✓ locations view created');
  } catch (e: any) {
    console.log(`✗ locations: ${e.message}`);
  }

  await conn.end();
  console.log('Schema fix complete');
}

fixSchema().catch(console.error);
