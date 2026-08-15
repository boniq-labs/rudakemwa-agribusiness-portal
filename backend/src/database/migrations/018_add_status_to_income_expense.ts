import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '018_add_status_to_income_expense';

export async function up(conn: mysql.Connection): Promise<void> {
  // income_records / expense_records gain a confirmable status.
  // New records default to 'pending' (created by sales orders / payroll salary
  // payments) and only count toward totals once confirmed by accounting.
  await addColumnIfNotExists(conn, 'income_records', 'status', "ENUM('pending','confirmed') NOT NULL DEFAULT 'pending'");
  await addColumnIfNotExists(conn, 'expense_records', 'status', "ENUM('pending','confirmed') NOT NULL DEFAULT 'pending'");

  // Existing rows are real, already-booked transactions — backfill to 'confirmed'
  // so dashboards keep showing historic totals (no data loss / no double count).
  await conn.query("UPDATE income_records SET status = 'confirmed' WHERE status = 'pending'");
  await conn.query("UPDATE expense_records SET status = 'confirmed' WHERE status = 'pending'");
}
