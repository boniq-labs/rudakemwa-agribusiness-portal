import mysql from 'mysql2/promise';

export const name = '028_add_created_by_to_customers';

export async function up(conn: mysql.Connection): Promise<void> {
  await conn.query(`
    ALTER TABLE customers
    ADD COLUMN created_by INT NULL,
    ADD CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  `);
}