import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name', 'model']);
    const countQuery = `SELECT COUNT(*) as total FROM equipment WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT * FROM equipment WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, serial_number, type, condition, status, location, purchase_date, purchase_price, notes } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO equipment (name, model, category, serial_number, purchase_date, quantity, item_condition, status, location, purchase_price, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [name, type || '', type || '', serial_number, purchase_date || null, 1, condition || 'good', status, location, purchase_price || 0, notes || '']
    );
    await logAudit(req, createAuditEntry(req, 'Create Equipment', 'Equipment', `Equipment ${name} created`));
    return created(res, { id: result.insertId }, 'Equipment created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, serial_number, type, condition, status, location, purchase_date, purchase_price, notes } = req.body;
    const [old]: any = await pool.query('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Equipment not found', 404);
    await pool.query(
      'UPDATE equipment SET name=?, model=?, category=?, serial_number=?, purchase_date=?, quantity=?, item_condition=?, status=?, location=?, purchase_price=?, notes=? WHERE id=?',
      [name, type || '', type || '', serial_number, purchase_date || null, 1, condition || 'good', status, location, purchase_price || 0, notes || '', req.params.id]
    );
    return success(res, null, 'Equipment updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Equipment not found', 404);
    await pool.query('UPDATE equipment SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Equipment deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const createEquipmentMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { maintenance_type, description, cost, performed_by, maintenance_date, next_maintenance_date } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO equipment_maintenance (equipment_id, maintenance_type, description, cost, service_provider, date, next_maintenance_date) VALUES (?,?,?,?,?,?,?)',
      [req.params.id, maintenance_type, description, cost, performed_by, maintenance_date || null, next_maintenance_date || null]
    );
    await pool.query('UPDATE equipment SET status = ? WHERE id = ?', ['maintenance', req.params.id]);
    return created(res, { id: result.insertId }, 'Maintenance record created');
  } catch (err: any) { return error(res, err.message); }
};
