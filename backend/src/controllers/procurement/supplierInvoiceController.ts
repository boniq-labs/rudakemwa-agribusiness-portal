import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getSupplierInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, status } = req.query;
    let query = `SELECT si.*, po.po_number, s.supplier_name as supplier
                 FROM supplier_invoices si
                 JOIN purchase_orders po ON si.po_id = po.id
                 JOIN suppliers s ON si.supplier_id = s.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (supplier_id) { query += ` AND si.supplier_id = ?`; params.push(supplier_id); }
    if (status) { query += ` AND si.status = ?`; params.push(status); }

    query += ` ORDER BY si.created_at DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createSupplierInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { invoice_number, supplier_id, po_id, amount, due_date } = req.body;
    const invNo = invoice_number || `INV-${Date.now()}`;
    const [result]: any = await pool.query(
      `INSERT INTO supplier_invoices (invoice_number, supplier_id, po_id, amount, total, due_date, status)
       VALUES (?,?,?,?,?,?,'pending')`,
      [invNo, supplier_id, po_id, amount, amount, due_date || null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Supplier Invoice', 'Procurement', `Created invoice ${invNo}`, req.body));
    return created(res, { id: result.insertId }, 'Invoice created');
  } catch (err: any) { return error(res, err.message); }
};

export const recordSupplierPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { invoice_id, amount, payment_date, payment_method, reference_number } = req.body;
    const [inv]: any = await pool.query('SELECT * FROM supplier_invoices WHERE id = ?', [invoice_id]);
    if (inv.length === 0) return error(res, 'Invoice not found', 404);

    const [result]: any = await pool.query(
      `INSERT INTO supplier_payments (invoice_id, amount, payment_date, payment_method, reference_number)
       VALUES (?,?,?,?,?)`,
      [invoice_id, amount, payment_date, payment_method, reference_number]
    );

    const [paid]: any = await pool.query(
      'SELECT COALESCE(SUM(amount),0) as total_paid FROM supplier_payments WHERE invoice_id = ?',
      [invoice_id]
    );

    const totalPaid = paid[0].total_paid;
    const invTotal = inv[0].total || inv[0].amount;
    const newStatus = totalPaid >= invTotal ? 'paid' : 'partial';
    await pool.query('UPDATE supplier_invoices SET status=? WHERE id=?', [newStatus, invoice_id]);

    await logAudit(req, createAuditEntry(req, 'Record Payment', 'Procurement', `Payment recorded for invoice ${invoice_id}`, req.body));
    return created(res, { id: result.insertId }, 'Payment recorded');
  } catch (err: any) { return error(res, err.message); }
};

export const getSupplierContracts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT sc.*, s.supplier_name as supplier FROM supplier_contracts sc
       JOIN suppliers s ON sc.supplier_id = s.id
       WHERE sc.deleted_at IS NULL ORDER BY sc.start_date DESC`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createSupplierContract = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, contract_number, title, description, start_date, end_date, value, terms } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO supplier_contracts (supplier_id, contract_number, title, description, start_date, end_date, value, terms, status)
       VALUES (?,?,?,?,?,?,?,?,'active')`,
      [supplier_id, contract_number, title, description || null, start_date, end_date, value, terms || null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Contract', 'Procurement', `Created contract ${contract_number}`, req.body));
    return created(res, { id: result.insertId }, 'Contract created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateSupplierContract = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, contract_number, title, description, start_date, end_date, value, terms, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM supplier_contracts WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (old.length === 0) return error(res, 'Contract not found', 404);
    await pool.query(
      `UPDATE supplier_contracts SET supplier_id=?, contract_number=?, title=?, description=?, start_date=?, end_date=?, value=?, terms=?, status=? WHERE id=?`,
      [supplier_id, contract_number, title, description, start_date, end_date, value, terms, status, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Contract', 'Procurement', `Updated contract ${contract_number}`, req.body, old[0]));
    return success(res, null, 'Contract updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpiringContracts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT sc.*, s.supplier_name as supplier FROM supplier_contracts sc
       JOIN suppliers s ON sc.supplier_id = s.id
       WHERE sc.deleted_at IS NULL AND sc.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY sc.end_date`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
