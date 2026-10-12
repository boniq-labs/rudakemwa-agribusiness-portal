import mysql from 'mysql2/promise';

export const name = '030_create_sales_voice_recordings';

export async function up(conn: mysql.Connection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sales_voice_recordings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sales_order_id INT NULL,
      customer_id INT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      duration_seconds INT NULL,
      file_size_bytes INT NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_sales_voice_order (sales_order_id),
      INDEX idx_sales_voice_customer (customer_id),
      INDEX idx_sales_voice_created_by (created_by),
      FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}