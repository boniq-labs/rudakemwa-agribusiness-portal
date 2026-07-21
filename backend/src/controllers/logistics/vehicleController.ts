import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getVehicleTypes = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM vehicle_types WHERE deleted_at IS NULL');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createVehicleType = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const [result]: any = await pool.query('INSERT INTO vehicle_types (name, description) VALUES (?,?)', [name, description]);
    return created(res, { id: result.insertId }, 'Vehicle type created');
  } catch (err: any) { return error(res, err.message); }
};

export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['vehicle_name', 'plate_number', 'model']);
    let filters = '';
    if (req.query.type_id) { filters += ' AND v.type_id = ?'; params.push(req.query.type_id); }
    if (req.query.status) { filters += ' AND v.status = ?'; params.push(req.query.status); }
    const countQuery = `SELECT COUNT(*) as total FROM vehicles v WHERE v.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT v.*, vt.name as type_name FROM vehicles v LEFT JOIN vehicle_types vt ON v.type_id = vt.id WHERE v.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const name = req.body.vehicle_name || req.body.name || '';
    const { plate_number, type_id, model, year, capacity, fuel_type, status } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO vehicles (vehicle_name, plate_number, type_id, model, year, capacity, fuel_type, status) VALUES (?,?,?,?,?,?,?,?)',
      [name, plate_number, type_id, model, year, capacity, fuel_type || null, status || 'available']
    );
    await logAudit(req, createAuditEntry(req, 'Create Vehicle', 'Vehicles', `Vehicle ${name} created`));
    return created(res, { id: result.insertId }, 'Vehicle created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const name = req.body.vehicle_name || req.body.name || '';
    const { plate_number, type_id, model, year, capacity, fuel_type, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Vehicle not found', 404);
    await pool.query(
      'UPDATE vehicles SET vehicle_name=?, plate_number=?, type_id=?, model=?, year=?, capacity=?, fuel_type=?, status=? WHERE id=?',
      [name, plate_number, type_id, model, year, capacity, fuel_type || null, status, req.params.id]
    );
    return success(res, null, 'Vehicle updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Vehicle not found', 404);
    await pool.query('UPDATE vehicles SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Vehicle deleted');
  } catch (err: any) { return error(res, err.message); }
};
