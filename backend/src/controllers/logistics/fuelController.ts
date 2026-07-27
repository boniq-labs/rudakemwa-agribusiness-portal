import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getFuelRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);
    let filters = '';
    if (req.query.vehicle_id) { filters += ' AND fr.vehicle_id = ?'; params.push(req.query.vehicle_id); }
    if (req.query.start_date) { filters += ' AND fr.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND fr.date <= ?'; params.push(req.query.end_date); }
    const countQuery = `SELECT COUNT(*) as total FROM fuel_records fr WHERE fr.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT fr.*, v.vehicle_name FROM fuel_records fr LEFT JOIN vehicles v ON fr.vehicle_id = v.id WHERE fr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createFuelRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, quantity, cost, date, fuel_type, mileage, notes } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO fuel_records (vehicle_id, quantity, cost, date, fuel_type, mileage, notes) VALUES (?,?,?,?,?,?,?)',
      [vehicle_id, quantity, cost, date || new Date().toISOString().split('T')[0], fuel_type || null, mileage || null, notes || null]
    );
    return created(res, { id: result.insertId }, 'Fuel record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateFuelRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, quantity, cost, date, fuel_type, mileage, notes } = req.body;
    const [old]: any = await pool.query('SELECT * FROM fuel_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Fuel record not found', 404);
    await pool.query(
      'UPDATE fuel_records SET vehicle_id=?, quantity=?, cost=?, date=?, fuel_type=?, mileage=?, notes=? WHERE id=?',
      [vehicle_id, quantity, cost, date || null, fuel_type, mileage, notes, req.params.id]
    );
    return success(res, null, 'Fuel record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteFuelRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM fuel_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Fuel record not found', 404);
    await pool.query('UPDATE fuel_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Fuel record deleted');
  } catch (err: any) { return error(res, err.message); }
};

