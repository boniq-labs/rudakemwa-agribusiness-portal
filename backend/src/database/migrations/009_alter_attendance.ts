import mysql from 'mysql2/promise';
import { addColumnIfNotExists, modifyColumn } from '../migrationHelpers';

export const name = '009_alter_attendance';

export async function up(conn: mysql.Connection): Promise<void> {
  // attendance column fixes
  await addColumnIfNotExists(conn, 'attendance', 'user_id', `INT AFTER \`employee_id\``);
  await addColumnIfNotExists(conn, 'attendance', 'total_hours', `DECIMAL(5,2) AFTER \`overtime_minutes\``);
  await modifyColumn(conn, 'attendance', 'check_in', 'DATETIME');
  await modifyColumn(conn, 'attendance', 'check_out', 'DATETIME');
}
