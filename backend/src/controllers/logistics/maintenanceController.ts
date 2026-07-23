import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getMaintenanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);
    let filters = '';
    if (req.query.vehicle_id) { filters += ' AND mr.vehicle_id = ?'; params.push(req.query.vehicle_id); }
    if (req.query.maintenance_type) { filters += ' AND mr.maintenance_type = ?'; params.push(req.query.maintenance_type); }
    const countQuery = `SELECT COUNT(*) as total FROM vehicle_maintenance mr WHERE mr.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT mr.*, v.vehicle_name as vehicle_name FROM vehicle_maintenance mr LEFT JOIN vehicles v ON mr.vehicle_id = v.id WHERE mr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createMaintenanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, date, maintenance_type, description, cost, next_service_date } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO vehicle_maintenance (vehicle_id, date, maintenance_type, description, cost, next_service_date) VALUES (?,?,?,?,?,?)',
      [vehicle_id, date, maintenance_type, description, cost, next_service_date]
    );
    await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', ['maintenance', vehicle_id]);
    return created(res, { id: result.insertId }, 'Maintenance record created');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteMaintenanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM vehicle_maintenance WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Maintenance record not found', 404);
    await pool.query('UPDATE vehicle_maintenance SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Maintenance record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateMaintenanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, date, maintenance_type, description, cost, service_provider, next_service_date } = req.body;
    const [old]: any = await pool.query('SELECT * FROM vehicle_maintenance WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Maintenance record not found', 404);
    await pool.query(
      'UPDATE vehicle_maintenance SET vehicle_id=?, date=?, maintenance_type=?, description=?, cost=?, service_provider=?, next_service_date=? WHERE id=?',
      [vehicle_id, date, maintenance_type, description, cost, service_provider || old[0].service_provider || null, next_service_date || null, req.params.id]
    );
    return success(res, null, 'Maintenance record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getDueMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT mr.*, v.vehicle_name as vehicle_name FROM vehicle_maintenance mr JOIN vehicles v ON mr.vehicle_id = v.id WHERE mr.next_service_date IS NOT NULL AND mr.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) ORDER BY mr.next_service_date'
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

