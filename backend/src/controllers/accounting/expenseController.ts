import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getExpenseCategories = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM expense_categories ORDER BY name');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const [result]: any = await pool.query('INSERT INTO expense_categories (name, description) VALUES (?,?)', [name, description]);
    await logAudit(req, createAuditEntry(req, 'Create Expense Category', 'Accounting', `Expense category ${name} created`, req.body));
    return created(res, { id: result.insertId }, 'Expense category created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM expense_categories WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Expense category not found', 404);
    const { name, description } = req.body;
    await pool.query('UPDATE expense_categories SET name=?, description=? WHERE id=?', [name, description, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Update Expense Category', 'Accounting', `Expense category #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Expense category updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpenseRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, department_id, start_date, end_date, startDate, endDate, status } = req.query;
    const sd = start_date || startDate || '';
    const ed = end_date || endDate || '';
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (category_id) { where += ' AND e.category_id = ?'; params.push(category_id); }
    if (department_id) { where += ' AND e.department_id = ?'; params.push(department_id); }
    if (sd) { where += ' AND e.date >= ?'; params.push(sd); }
    if (ed) { where += ' AND e.date <= ?'; params.push(ed); }
    if (status) { where += ' AND e.status = ?'; params.push(status); }
    const [rows]: any = await pool.query(
      `SELECT e.*, ec.name as category_name, d.name as department_name
       FROM expense_records e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${where} ORDER BY e.date DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

async function getExpenseCategoryId(b: any): Promise<number | null> {
  if (b.category_id) return Number(b.category_id);
  if (b.category) {
    if (!isNaN(Number(b.category))) return Number(b.category);
    const [rows]: any = await (await import('../../config/database')).default.query('SELECT id FROM expense_categories WHERE name = ?', [b.category]);
    if (rows.length > 0) return rows[0].id;
  }
  return null;
}

export const createExpenseRecord = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    const category_id = await getExpenseCategoryId(b);
    const payment_method = (b.payment_method || '').toLowerCase().replace(/\s+/g, '_');
    const genExpenseNumber = b.expense_number || `EXP-${Date.now()}`;
    const status = b.status === 'pending' ? 'pending' : 'confirmed';
    // Business date defaults to server-side today when not provided; the
    // record's creation timestamp (created_at) is always set by the database.
    const recordDate = b.date || new Date().toISOString().split('T')[0];
    const [result]: any = await pool.query(
      `INSERT INTO expense_records (expense_number, category_id, description, amount, payment_method, vendor, notes, date, department_id, status) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [genExpenseNumber, category_id, b.description || null, b.amount, payment_method || null, b.vendor || null, b.notes || null, recordDate, b.department_id || null, status]
    );
    await logAudit(req, createAuditEntry(req, 'Create Expense', 'Accounting', `Expense record ${genExpenseNumber} created`, req.body));
    return created(res, { id: result.insertId }, 'Expense record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateExpenseRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM expense_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Expense record not found', 404);
    const b = req.body;
    const category_id = await getExpenseCategoryId(b);
    const payment_method = (b.payment_method || '').toLowerCase().replace(/\s+/g, '_');
    await pool.query(
      `UPDATE expense_records SET category_id=?, description=?, amount=?, payment_method=?, vendor=?, notes=?, date=?, department_id=? WHERE id=?`,
      [category_id, b.description || null, b.amount, payment_method || null, b.vendor || null, b.notes || null, b.date || null, b.department_id || null, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Expense', 'Accounting', `Expense record #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Expense record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteExpenseRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM expense_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Expense record not found', 404);
    await pool.query('DELETE FROM expense_records WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Expense', 'Accounting', `Expense record #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Expense record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const confirmExpenseRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM expense_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Expense record not found', 404);
    if (old[0].status === 'confirmed') return error(res, 'Expense record already confirmed', 400);
    await pool.query('UPDATE expense_records SET status = ? WHERE id = ?', ['confirmed', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Confirm Expense', 'Accounting', `Expense record #${req.params.id} confirmed`, null, old[0]));
    return success(res, null, 'Expense record confirmed');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpenseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { period, group } = req.query;
    let format = '%Y-%m-%d';
    if (period === 'weekly') format = '%Y-%u';
    else if (period === 'monthly') format = '%Y-%m';
    else if (period === 'yearly') format = '%Y';
    const groupBy = group === 'category' ? ', ec.name' : '';
    const join = group === 'category' ? 'LEFT JOIN expense_categories ec ON e.category_id = ec.id' : '';
    const selectGroup = group === 'category' ? ', ec.name as group_name' : '';
    const [rows]: any = await pool.query(
      `SELECT DATE_FORMAT(e.date, '${format}') as period${selectGroup}, SUM(e.amount) as total, COUNT(*) as count
       FROM expense_records e ${join}
       WHERE e.status = 'confirmed'
       GROUP BY DATE_FORMAT(e.date, '${format}')${groupBy} ORDER BY period DESC`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
