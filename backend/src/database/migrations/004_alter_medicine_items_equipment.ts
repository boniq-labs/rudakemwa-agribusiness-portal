import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '004_alter_medicine_items_equipment';

export async function up(conn: mysql.Connection): Promise<void> {
  // medicine_items missing columns
  await addColumnIfNotExists(conn, 'medicine_items', 'brand', `VARCHAR(200) AFTER \`name\``);
  await addColumnIfNotExists(conn, 'medicine_items', 'unit_price', `DECIMAL(12,2) DEFAULT 0 AFTER \`unit\``);
  await addColumnIfNotExists(conn, 'medicine_items', 'reorder_level', `DECIMAL(10,2) DEFAULT 0 AFTER \`unit_price\``);
  await addColumnIfNotExists(conn, 'medicine_items', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // equipment missing columns
  await addColumnIfNotExists(conn, 'equipment', 'model', `VARCHAR(200) AFTER \`name\``);
  await addColumnIfNotExists(conn, 'equipment', 'category', `VARCHAR(50) AFTER \`model\``);
  await addColumnIfNotExists(conn, 'equipment', 'quantity', `DECIMAL(10,2) DEFAULT 1 AFTER \`purchase_date\``);
  await addColumnIfNotExists(conn, 'equipment', 'location', `VARCHAR(255) AFTER \`status\``);
  await addColumnIfNotExists(conn, 'equipment', 'purchase_price', `DECIMAL(12,2) DEFAULT 0 AFTER \`purchase_date\``);
  await addColumnIfNotExists(conn, 'equipment', 'min_stock_level', `DECIMAL(10,2) DEFAULT 0 AFTER \`quantity\``);
}
