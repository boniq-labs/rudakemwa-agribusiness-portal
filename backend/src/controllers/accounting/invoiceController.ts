import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, type, status } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (customer_id) { where += ' AND i.customer_id = ?'; params.push(customer_id); }
    if (type) { where += ' AND i.type = ?'; params.push(type); }
    if (status) { where += ' AND i.status = ?'; params.push(status); }
    const [rows]: any = await pool.query(
      `SELECT i.*, c.first_name, c.last_name, c.company_name
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       ${where} ORDER BY i.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { invoice_number, customer_id, type, items, tax, total_amount, due_date, notes } = req.body;
    const invNumber = invoice_number || `INV-${Date.now()}`;
    const safeItems = items || [];
    const computedTotal = safeItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const finalTotal = total_amount || computedTotal + (Number(tax) || 0);
    const [result]: any = await pool.query(
      `INSERT INTO invoices (invoice_number, customer_id, type, total_amount, tax, due_date, notes) VALUES (?,?,?,?,?,?,?)`,
      [invNumber, customer_id || null, type || 'income', finalTotal, Number(tax) || 0, due_date || null, notes || null]
    );
    for (const item of safeItems) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?,?,?,?,?)`,
        [result.insertId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Invoice', 'Accounting', `Invoice ${invNumber} created`, req.body));
    return created(res, { id: result.insertId }, 'Invoice created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    const { invoice_number, customer_id, type, total_amount, tax, due_date, notes, status } = req.body;
    await pool.query(
      `UPDATE invoices SET invoice_number=?, customer_id=?, type=?, total_amount=?, tax=?, due_date=?, notes=?, status=? WHERE id=?`,
      [invoice_number || old[0].invoice_number, customer_id ?? old[0].customer_id, type || old[0].type, total_amount ?? old[0].total_amount, tax ?? old[0].tax, due_date || old[0].due_date, notes ?? old[0].notes, status || old[0].status, req.params.id]
    );
    if (req.body.items) {
      await pool.query('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
      for (const item of req.body.items) {
        await pool.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?,?,?,?,?)`,
          [req.params.id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }
    await logAudit(req, createAuditEntry(req, 'Update Invoice', 'Accounting', `Invoice #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Invoice updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Invoice', 'Accounting', `Invoice #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Invoice deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    await pool.query('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Update Invoice Status', 'Accounting', `Invoice #${req.params.id} status changed to ${status}`, req.body, old[0]));
    return success(res, null, 'Invoice status updated');
  } catch (err: any) { return error(res, err.message); }
};

export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const invoice_id = req.params.id || req.body.invoice_id;
    if (!invoice_id) return error(res, 'Invoice ID is required', 400);
    const { amount, payment_method, reference_number } = req.body;
    const [inv]: any = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
    if (inv.length === 0) return error(res, 'Invoice not found', 404);
    const finalAmount = amount || inv[0].total_amount;
    const [result]: any = await pool.query(
      `INSERT INTO receipts (receipt_number, invoice_id, amount, payment_method, reference_number, date) VALUES (?,?,?,?,?,CURDATE())`,
      [`RCP-${Date.now()}`, invoice_id, finalAmount, payment_method || null, reference_number || null]
    );
    const paidTotal = await pool.query('SELECT SUM(amount) as paid FROM receipts WHERE invoice_id = ?', [invoice_id]);
    const paid: number = (paidTotal[0] as any)[0]?.paid || 0;
    if (paid >= inv[0].total_amount) {
      await pool.query('UPDATE invoices SET status = ? WHERE id = ?', ['paid', invoice_id]);
    } else {
      await pool.query('UPDATE invoices SET status = ? WHERE id = ?', ['partial', invoice_id]);
    }
    await logAudit(req, createAuditEntry(req, 'Record Payment', 'Accounting', `Payment of ${amount} recorded for invoice #${invoice_id}`, req.body));
    return created(res, { id: result.insertId }, 'Payment recorded');
  } catch (err: any) { return error(res, err.message); }
};

export const getInvoicePDF = async (req: AuthRequest, res: Response) => {
  try {
    const [inv]: any = await pool.query(
      `SELECT i.*, c.first_name, c.last_name, c.company_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`, [req.params.id]
    );
    if (inv.length === 0) return error(res, 'Invoice not found', 404);
    const [items]: any = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    return success(res, { invoice: inv[0], items });
  } catch (err: any) { return error(res, err.message); }
};
