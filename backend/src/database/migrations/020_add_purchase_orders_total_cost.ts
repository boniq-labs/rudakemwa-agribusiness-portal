import mysql from 'mysql2/promise';

export const name = '020_add_purchase_orders_total_cost';

export async function up(conn: mysql.Connection): Promise<void> {
  // Add total_cost to purchase_orders so the PO cost is persisted directly.
  // Previously cost was only derivable from purchase_order_items, but the
  // create form has no line items — the cost is entered as a single value.
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'total_cost'`
  );
  if (Number(rows[0].c) === 0) {
    await conn.query('ALTER TABLE purchase_orders ADD COLUMN total_cost DECIMAL(12,2) NULL AFTER quotation_id');
  }
}