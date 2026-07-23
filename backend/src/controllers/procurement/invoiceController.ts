import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getProcurementInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['invoice_number']);
    let filters = '';
    if (req.query.status) { filters += ' AND si.status = ?'; params.push(req.query.status); }
    if (req.query.supplier_id) { filters += ' AND si.supplier_id = ?'; params.push(req.query.supplier_id); }
    const countQuery = `SELECT COUNT(*) as total FROM supplier_invoices si WHERE si.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT si.*, s.supplier_name as supplier FROM supplier_invoices si LEFT JOIN suppliers s ON si.supplier_id = s.id WHERE si.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createProcurementInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, po_id, amount, due_date } = req.body;
    const invoice_number = req.body.invoice_number || `INV-${Date.now()}`;
    const [result]: any = await pool.query(
      'INSERT INTO supplier_invoices (invoice_number, supplier_id, po_id, amount, total, due_date, status) VALUES (?,?,?,?,?,?,?)',
      [invoice_number, supplier_id, po_id, amount, amount, due_date || null, 'pending']
    );
    return created(res, { id: result.insertId }, 'Invoice created');
  } catch (err: any) { return error(res, err.message); }
};

export const payProcurementInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM supplier_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    await pool.query('UPDATE supplier_invoices SET status = ? WHERE id = ?', ['paid', req.params.id]);
    return success(res, null, 'Invoice paid');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProcurementInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, po_id, amount, due_date, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM supplier_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    await pool.query(
      'UPDATE supplier_invoices SET supplier_id=?, po_id=?, amount=?, due_date=?, status=? WHERE id=?',
      [supplier_id, po_id || null, amount, due_date || null, status || 'pending', req.params.id]
    );
    return success(res, null, 'Invoice updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteProcurementInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM supplier_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Invoice not found', 404);
    await pool.query('UPDATE supplier_invoices SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Invoice deleted');
  } catch (err: any) { return error(res, err.message); }
};
