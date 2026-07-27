import mysql from 'mysql2/promise';
import { modifyColumn } from '../migrationHelpers';

export const name = '011_alter_employee_code_length';

export async function up(conn: mysql.Connection): Promise<void> {
  await modifyColumn(conn, 'employees', 'employee_code', 'VARCHAR(250) UNIQUE NOT NULL');
}
