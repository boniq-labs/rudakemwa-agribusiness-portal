import mysql from 'mysql2/promise';

export const name = '019_alter_customer_payments_invoice_nullable';

export async function up(conn: mysql.Connection): Promise<void> {
  // customer_payments.invoice_id is NOT NULL by default, but customer walk-in sales
  // record payments without an invoice. Make it nullable so these sales can be booked.
  const [rows]: any = await conn.query(
    `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_payments' AND COLUMN_NAME = 'invoice_id'`
  );
  if (rows.length > 0 && rows[0].IS_NULLABLE === 'NO') {
    await conn.query('ALTER TABLE customer_payments MODIFY COLUMN invoice_id INT NULL');
  }
}
