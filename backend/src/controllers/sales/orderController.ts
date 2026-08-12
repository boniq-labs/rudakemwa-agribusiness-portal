import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getSalesOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, status, start_date, end_date, startDate, endDate } = req.query;
    const sd = start_date || startDate || '';
    const ed = end_date || endDate || '';
    let where = 'WHERE so.deleted_at IS NULL';
    const params: any[] = [];
    if (customer_id) { where += ' AND so.customer_id = ?'; params.push(customer_id); }
    if (status) { where += ' AND so.status = ?'; params.push(status); }
    if (sd) { where += ' AND so.order_date >= ?'; params.push(sd); }
    if (ed) { where += ' AND so.order_date <= ?'; params.push(ed); }
    const [rows]: any = await pool.query(
      `SELECT so.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name, c.company_name
       FROM sales_orders so LEFT JOIN customers c ON so.customer_id = c.id
       ${where} ORDER BY so.created_at DESC`, params
    );
    if (rows.length > 0) {
      const orderIds = rows.map((r: any) => r.id);
      const placeholders = orderIds.map(() => '?').join(',');
      const [allItems]: any = await pool.query(`SELECT * FROM sales_order_items WHERE order_id IN (${placeholders}) ORDER BY id`, orderIds);
      const itemsByOrder: Record<number, any[]> = {};
      for (const item of allItems) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }
      for (const order of rows) {
        order.items = itemsByOrder[order.id] || [];
      }
    }
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createSalesOrder = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    const order_number = b.order_number || `ORD-${Date.now()}`;
    const items = (Array.isArray(b.items) && b.items.length > 0)
      ? b.items
      : (b.product_id ? [{ product_id: b.product_id, quantity: b.quantity, unit_price: b.unit_price }] : []);
    const total_amount = (b.total_amount && b.total_amount > 0) ? b.total_amount : items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const order_date = b.order_date || new Date().toISOString().split('T')[0];
    const [result]: any = await pool.query(
      `INSERT INTO sales_orders (order_number, customer_id, total_amount, order_date, notes) VALUES (?,?,?,?,?)`,
      [order_number, b.customer_id, total_amount, order_date, b.notes || null]
    );
    for (const item of items) {
      await pool.query(
        `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?,?,?,?,?)`,
        [result.insertId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Sales Order', 'Sales', `Sales order ${order_number} created`, req.body));
    return created(res, { id: result.insertId }, 'Sales order created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateSalesOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Sales order not found', 404);
    const oldStatus = old[0].status;
    await pool.query('UPDATE sales_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'completed' && oldStatus !== 'completed') {
      const [items]: any = await pool.query('SELECT * FROM sales_order_items WHERE order_id = ?', [req.params.id]);
      for (const item of items) {
        await pool.query('UPDATE products SET quantity_available = quantity_available - ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      // Create income record for completed sale
      const [order]: any = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
      const [customer]: any = await pool.query('SELECT CONCAT(first_name, " ", last_name) as name FROM customers WHERE id = ?', [order[0].customer_id]);
      const incomeNumber = `INC-SAL-${Date.now()}`;
      await pool.query(
        `INSERT INTO income_records (income_number, source, customer_id, amount, payment_method, date, description, created_by) VALUES (?,?,?,?,?,?,?,?)`,
        [`INC-SAL-${Date.now()}`, 'Sales Revenue', order[0].customer_id, order[0].total_amount, 'Cash', new Date().toISOString().split('T')[0], `Sales order ${order[0].order_number} completed`, req.user?.id]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Update Sales Order Status', 'Sales', `Order #${req.params.id} status changed to ${status}`, req.body, old[0]));
    return success(res, null, 'Sales order status updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getQuotations = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, status } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (customer_id) { where += ' AND q.customer_id = ?'; params.push(customer_id); }
    if (status) { where += ' AND q.status = ?'; params.push(status); }
    const [rows]: any = await pool.query(
      `SELECT q.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name, c.company_name
       FROM sales_quotations q LEFT JOIN customers c ON q.customer_id = c.id
       ${where} ORDER BY q.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { quotation_number, customer_id, items, notes } = req.body;
    const qNumber = quotation_number || `QTN-${Date.now()}`;
    const total_amount = items ? items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0) : 0;
    const [result]: any = await pool.query(
      `INSERT INTO sales_quotations (quotation_number, customer_id, total_amount) VALUES (?,?,?)`,
      [qNumber, customer_id, total_amount]
    );
    for (const item of items || []) {
      await pool.query(
        `INSERT INTO sales_quotation_items (quotation_id, product_id, description, quantity, unit_price, total_price) VALUES (?,?,?,?,?,?)`,
        [result.insertId, item.product_id, item.description || null, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Quotation', 'Sales', `Quotation ${qNumber} created`, req.body));
    return created(res, { id: result.insertId }, 'Quotation created');
  } catch (err: any) { return error(res, err.message); }
};

export const convertQuotationToOrder = async (req: AuthRequest, res: Response) => {
  try {
    const [quotation]: any = await pool.query('SELECT * FROM sales_quotations WHERE id = ?', [req.params.id]);
    if (quotation.length === 0) return error(res, 'Quotation not found', 404);
    const [qItems]: any = await pool.query('SELECT * FROM sales_quotation_items WHERE quotation_id = ?', [req.params.id]);
    const orderNumber = `ORD-${Date.now()}`;
    const [orderResult]: any = await pool.query(
      `INSERT INTO sales_orders (order_number, customer_id, total_amount, notes) VALUES (?,?,?,?)`,
      [orderNumber, quotation[0].customer_id, quotation[0].total_amount, quotation[0].notes]
    );
    for (const item of qItems) {
      await pool.query(
        `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?,?,?,?,?)`,
        [orderResult.insertId, item.product_id, item.quantity, item.unit_price, item.total_price]
      );
    }
    await pool.query('UPDATE sales_quotations SET status = ? WHERE id = ?', ['converted', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Convert Quotation to Order', 'Sales', `Quotation #${req.params.id} converted to order ${orderNumber}`));
    return created(res, { order_id: orderResult.insertId, order_number: orderNumber }, 'Quotation converted to order');
  } catch (err: any) { return error(res, err.message); }
};


