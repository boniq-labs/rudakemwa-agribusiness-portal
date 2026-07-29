import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '013_alter_expense_records_add_columns';

export async function up(conn: mysql.Connection): Promise<void> {
  await addColumnIfNotExists(conn, 'expense_records', 'payment_method', 'VARCHAR(50) DEFAULT \'Cash\'');
  await addColumnIfNotExists(conn, 'expense_records', 'vendor', 'VARCHAR(200)');
  await addColumnIfNotExists(conn, 'expense_records', 'notes', 'TEXT');
}
