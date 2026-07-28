import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '012_alter_sales_orders_deleted_at';

export async function up(conn: mysql.Connection): Promise<void> {
  await addColumnIfNotExists(conn, 'sales_orders', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
}
