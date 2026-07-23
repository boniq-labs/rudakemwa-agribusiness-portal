import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name', 'brand']);
    let filters = '';
    if (req.query.category) { filters += ' AND category = ?'; params.push(req.query.category); }
    const countQuery = `SELECT COUNT(*) as total FROM medicine_items WHERE deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT * FROM medicine_items WHERE deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, quantity, unit_price, expiry_date, supplier_id, reorder_level } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO medicine_items (name, category, quantity, unit_price, expiry_date, supplier_id, reorder_level) VALUES (?,?,?,?,?,?,?)',
      [name, category, quantity, unit_price, expiry_date, supplier_id, reorder_level]
    );
    await logAudit(req, createAuditEntry(req, 'Create Medicine', 'Medicines', `Medicine ${name} created`));
    return created(res, { id: result.insertId }, 'Medicine created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, quantity, unit_price, expiry_date, supplier_id, reorder_level } = req.body;
    const [old]: any = await pool.query('SELECT * FROM medicine_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Medicine not found', 404);
    await pool.query(
      'UPDATE medicine_items SET name=?, category=?, quantity=?, unit_price=?, expiry_date=?, supplier_id=?, reorder_level=? WHERE id=?',
      [name, category, quantity, unit_price, expiry_date, supplier_id, reorder_level, req.params.id]
    );
    return success(res, null, 'Medicine updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpiringMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM medicine_items WHERE deleted_at IS NULL AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY expiry_date'
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const deleteMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM medicine_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Medicine not found', 404);
    await pool.query('UPDATE medicine_items SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Medicine', 'Medicines', `Deleted medicine ${old[0].name}`, null, old[0]));
    return success(res, null, 'Medicine deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpiredMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM medicine_items WHERE deleted_at IS NULL AND expiry_date < CURDATE() ORDER BY expiry_date'
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
