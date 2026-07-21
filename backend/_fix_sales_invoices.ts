import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  const run = async (sql: string) => { try { await c.query(sql); console.log('OK:', sql.substring(0, 80)); } catch (e: any) { console.log('ERR:', e.message); } };

  await run(`CREATE TABLE IF NOT EXISTS sales_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    quantity DECIMAL(15,2) DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS customer_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('Done');
  await c.end();
})();
