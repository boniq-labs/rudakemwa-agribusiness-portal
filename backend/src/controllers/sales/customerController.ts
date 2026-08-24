import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, AppError } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
}

// Generates a unique document number like SO-20260813-000001
async function generateUniqueNumber(connection: any, table: string, column: string, prefix: string): Promise<string> {
  const base = `${prefix}-${dateStamp()}-`;
  const [[row]]: any = await connection.query(`SELECT COUNT(*) as c FROM ${table} WHERE ${column} LIKE ?`, [`${base}%`]);
  let seq = Number(row.c) + 1;
  for (let i = 0; i < 50; i++) {
    const candidate = `${base}${pad(seq, 6)}`;
    const [[chk]]: any = await connection.query(`SELECT COUNT(*) as c FROM ${table} WHERE ${column} = ?`, [candidate]);
    if (Number(chk.c) === 0) return candidate;
    seq++;
  }
  return `${base}${Date.now()}`;
}

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { type, search, status } = req.query;
    let where = 'WHERE c.deleted_at IS NULL';
    const params: any[] = [];
    if (type) { where += ' AND c.customer_type = ?'; params.push(type); }
    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (search) { where += ' AND (CONCAT(c.first_name,\' \',c.last_name) LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    const [rows]: any = await pool.query(
      `SELECT c.*, CONCAT(c.first_name, ' ', c.last_name) as name,
       COALESCE((SELECT SUM(total_amount) FROM sales_orders WHERE customer_id = c.id AND status = 'completed' AND deleted_at IS NULL), 0) as total_purchase_amount
       FROM customers c ${where} ORDER BY c.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  let connection: any;
  try {
    const b = req.body;
    const name = b.name || '';
    const nameParts = name.split(' ');
    let first_name = b.first_name || nameParts[0] || '';
    let last_name = b.last_name || nameParts.slice(1).join(' ') || '';
    const customer_type = b.customer_type || b.type || 'individual';
    const customer_code = b.customer_code || `CUST-${Date.now()}`;
    const { company_name, phone, email, address, credit_limit, payment_terms, payment_method } = b;

    if (!first_name.trim() && !company_name) return error(res, 'Customer name is required', 400);

    const productIdNum = b.product_id !== undefined && b.product_id !== null && b.product_id !== ''
      ? Number(b.product_id) : NaN;
    const quantityNum = b.quantity !== undefined && b.quantity !== null && b.quantity !== ''
      ? Number(b.quantity) : NaN;
    const isSale = !isNaN(productIdNum) && productIdNum > 0;

    // "Other Sale": free-text farm product (eggs, chicken, manure, ...) —
    // deliberately bypasses Product Management and reuses the same
    // Customer → Payment → pending Income flow for Accountant confirmation.
    const otherProduct = typeof b.other_product === 'string' ? b.other_product.trim() : '';
    const costNum = b.cost !== undefined && b.cost !== null && b.cost !== '' ? Number(b.cost) : NaN;
    const isOtherSale = !isSale && otherProduct.length > 0;
    if (isOtherSale && (!Number.isFinite(costNum) || costNum <= 0)) return error(res, 'Cost must be greater than 0', 400);

    if (isSale) {
      if (!Number.isInteger(productIdNum) || productIdNum <= 0) return error(res, 'Invalid product', 400);
      if (isNaN(quantityNum) || quantityNum <= 0) return error(res, 'Quantity must be greater than 0', 400);
    }

    const saleProductId = isSale ? productIdNum : null;
    const saleQuantity = isSale ? quantityNum : null;

    connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const today = new Date().toISOString().split('T')[0];
      let unit_price = 0;
      let total_amount = 0;
      let paymentAmount = 0;
      let saleOrderNumber = '';
      let productName = '';
      let incomeNumber = '';

      if (isSale) {
        // Milk availability is auto-sourced from Milk Today - no permanent stock deduction.
        // Read the product's current price only.
        const [prod]: any = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [saleProductId]);
        if (prod.length === 0) throw new AppError(404, 'Product not found');
        const product = prod[0];
        if (product.deleted_at) throw new AppError(400, 'Product is deleted');
        if (product.status && String(product.status).toLowerCase() === 'inactive') throw new AppError(400, 'Product is inactive');

        unit_price = Number(product.price) || 0;
        total_amount = Number((saleQuantity! * unit_price).toFixed(2));
        paymentAmount = total_amount;
        productName = product.name || `Product #${saleProductId}`;
      }

      // 1. Customer: for Other Sales, reuse the EXISTING customer when the
      //    phone matches so repeat purchases accumulate on one row; otherwise create.
      let customer_id: number;
      if (isOtherSale && phone) {
        const [existing]: any = await connection.query(
          'SELECT id FROM customers WHERE phone = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1',
          [phone]
        );
        if (existing.length > 0) {
          customer_id = existing[0].id;
          const [names]: any = await connection.query('SELECT first_name, last_name FROM customers WHERE id = ?', [customer_id]);
          first_name = names[0]?.first_name || first_name;
          last_name = names[0]?.last_name || last_name;
        } else {
          customer_id = await insertCustomer(connection);
        }
      } else {
        customer_id = await insertCustomer(connection);
      }

      async function insertCustomer(conn: any): Promise<number> {
        // balance follows existing convention = payment amount (product sale or other sale)
        const initialBalance = (isSale || isOtherSale) ? paymentAmount : Math.max(0, Number(b.initial_payment) || 0);
        const [result]: any = await conn.query(
          `INSERT INTO customers (first_name, last_name, company_name, phone, email, address, customer_type, credit_limit, payment_terms, customer_code, balance)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [first_name, last_name, company_name || null, phone || null, email || null, address || null, customer_type, credit_limit || null, payment_terms || null, customer_code, initialBalance]
        );
        return result.insertId;
      }

      if (isSale) {
        // 2. Create completed sales order
        saleOrderNumber = await generateUniqueNumber(connection, 'sales_orders', 'order_number', 'SO');
        const [orderResult]: any = await connection.query(
          `INSERT INTO sales_orders (order_number, customer_id, order_date, status, total_amount, created_by)
           VALUES (?,?,?,?,?,?)`,
          [saleOrderNumber, customer_id, today, 'completed', total_amount, req.user?.id || null]
        );
        const order_id = orderResult.insertId;

        // 3. Create sales order item
        await connection.query(
          `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?,?,?,?,?)`,
          [order_id, saleProductId, saleQuantity, unit_price, total_amount]
        );

        // 4. (Removed) Permanent stock deduction - milk availability is auto-sourced from Milk Today

        // 5. Record customer payment
        await connection.query(
          `INSERT INTO customer_payments (customer_id, invoice_id, amount, payment_method, reference_number) VALUES (?,?,?,?,?)`,
          [customer_id, null, paymentAmount, payment_method || 'Cash', saleOrderNumber]
        );

        // 6. Create accounting income record (PENDING - does not increase Total Income until confirmed)
        incomeNumber = await generateUniqueNumber(connection, 'income_records', 'income_number', 'INC');
        const customerName = `${first_name} ${last_name}`.trim() || (company_name || '');
        await connection.query(
          `INSERT INTO income_records (income_number, source, customer_id, amount, payment_method, date, description, created_by, status)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [incomeNumber, 'Sales', customer_id, paymentAmount, (payment_method || 'Cash').toLowerCase().replace(/\s+/g, '_'), today, `Sale ${saleOrderNumber} - ${customerName} - ${saleQuantity} x ${productName}`, req.user?.id || null, 'pending']
        );
      } else if (isOtherSale) {
        // Other Sale: same Customer → Order → Payment → pending Income flow as
        // product sales, minus Product Management involvement. The completed
        // sales_orders row is what feeds the existing TOTAL PURCHASE column.
        total_amount = Number(costNum.toFixed(2));
        paymentAmount = total_amount;

        saleOrderNumber = await generateUniqueNumber(connection, 'sales_orders', 'order_number', 'SO');
        await connection.query(
          `INSERT INTO sales_orders (order_number, customer_id, order_date, status, total_amount, created_by)
           VALUES (?,?,?,?,?,?)`,
          [saleOrderNumber, customer_id, today, 'completed', total_amount, req.user?.id || null]
        );

        await connection.query(
          `INSERT INTO customer_payments (customer_id, invoice_id, amount, payment_method, reference_number) VALUES (?,?,?,?,?)`,
          [customer_id, null, paymentAmount, payment_method || 'Cash', saleOrderNumber]
        );

        incomeNumber = await generateUniqueNumber(connection, 'income_records', 'income_number', 'INC');
        const customerName2 = `${first_name} ${last_name}`.trim() || (company_name || '');
        await connection.query(
          `INSERT INTO income_records (income_number, source, customer_id, amount, payment_method, date, description, created_by, status)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [incomeNumber, 'Sales', customer_id, paymentAmount, (payment_method || 'Cash').toLowerCase().replace(/\s+/g, '_'), today, `Other Sale - ${customerName2} - ${otherProduct}`, req.user?.id || null, 'pending']
        );
      } else if (Number(b.initial_payment) > 0) {
        // Non-sale customer creation with an initial payment (existing behavior preserved)
        await connection.query(
          `INSERT INTO customer_payments (customer_id, amount, payment_method) VALUES (?, ?, ?)`,
          [customer_id, Math.max(0, Number(b.initial_payment) || 0), 'initial']
        );
      }

      await connection.commit();

      await logAudit(req, createAuditEntry(req, 'Create Customer', 'Sales', `Customer ${first_name} ${last_name} created`, req.body));
      if (isSale) {
        await logAudit(req, createAuditEntry(req, 'Create Sale', 'Sales', `Sale ${saleOrderNumber} created for customer #${customer_id}`, { order_number: saleOrderNumber, product_id: saleProductId, quantity: saleQuantity, unit_price, total_amount, payment_method }));
        await logAudit(req, createAuditEntry(req, 'Pending Income', 'Sales', `Pending income created for sale ${saleOrderNumber}`, { income_number: incomeNumber, total_amount }));
      }
      if (isOtherSale) {
        await logAudit(req, createAuditEntry(req, 'Other Sale', 'Sales', `Other sale (${otherProduct}) recorded for customer #${customer_id}`, { other_product: otherProduct, cost: total_amount, payment_method }));
        await logAudit(req, createAuditEntry(req, 'Pending Income', 'Sales', `Pending income created for other sale (${otherProduct})`, { income_number: incomeNumber, total_amount }));
      }
      return created(res, { id: customer_id }, 'Customer created');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    if (err instanceof AppError) return error(res, err.message, err.statusCode);
    return error(res, err.message);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Customer not found', 404);
    const b = req.body;
    const name = b.name || '';
    const nameParts = name.split(' ');
    const first_name = b.first_name || nameParts[0] || old[0].first_name;
    const last_name = b.last_name || nameParts.slice(1).join(' ') || old[0].last_name;
    const customer_type = b.customer_type || b.type || old[0].customer_type;
    const { company_name, phone, email, address, credit_limit, payment_terms, status } = b;
    const balance = b.balance !== undefined ? Math.max(0, Number(b.balance) || 0) : old[0].balance;
    await pool.query(
      `UPDATE customers SET first_name=?, last_name=?, company_name=?, phone=?, email=?, address=?, customer_type=?, credit_limit=?, payment_terms=?, status=?, balance=? WHERE id=?`,
      [first_name, last_name, company_name || null, phone || null, email || null, address || null, customer_type, credit_limit || null, payment_terms || null, status || old[0].status, balance, req.params.id]
    );
    if (b.balance !== undefined && balance > old[0].balance) {
      const diff = balance - old[0].balance;
      await pool.query(
        `INSERT INTO customer_payments (customer_id, invoice_id, amount, payment_method) VALUES (?, NULL, ?, ?)`,
        [req.params.id, diff, 'payment']
      );
    }
    await logAudit(req, createAuditEntry(req, 'Update Customer', 'Sales', `Customer #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Customer updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Customer not found', 404);
    await pool.query('UPDATE customers SET deleted_at = NOW(), status = ? WHERE id = ?', ['inactive', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Customer', 'Sales', `Customer #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Customer deleted');
  } catch (err: any) { return error(res, err.message); }
};
