import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getCropTypes = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name']);
    const countQuery = `SELECT COUNT(*) as total FROM crop_types WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT * FROM crop_types WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createCropType = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, usage } = req.body;
    const [result]: any = await pool.query('INSERT INTO crop_types (name, description, `usage`) VALUES (?,?,?)', [name, description, usage]);
    await logAudit(req, createAuditEntry(req, 'Create Crop Type', 'CropTypes', `Crop type ${name} created`));
    return created(res, { id: result.insertId }, 'Crop type created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateCropType = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, usage } = req.body;
    await pool.query('UPDATE crop_types SET name=?, description=?, `usage`=? WHERE id=?', [name, description, usage, req.params.id]);
    return success(res, null, 'Crop type updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteCropType = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE crop_types SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Crop type deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getLandAreas = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name', 'location']);
    const countQuery = `SELECT COUNT(*) as total FROM land_areas WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT * FROM land_areas WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createLandArea = async (req: AuthRequest, res: Response) => {
  try {
    const { name, area_size, location, description } = req.body;
    const [result]: any = await pool.query('INSERT INTO land_areas (name, area_size, location, description) VALUES (?,?,?,?)', [name, area_size, location, description]);
    await logAudit(req, createAuditEntry(req, 'Create Land Area', 'LandAreas', `Land area ${name} created`));
    return created(res, { id: result.insertId }, 'Land area created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateLandArea = async (req: AuthRequest, res: Response) => {
  try {
    const { name, area_size, location, description } = req.body;
    await pool.query('UPDATE land_areas SET name=?, area_size=?, location=?, description=? WHERE id=?', [name, area_size, location, description, req.params.id]);
    return success(res, null, 'Land area updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteLandArea = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE land_areas SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Land area deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getCropActivities = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);
    let filters = '';
    if (req.query.crop_type_id) { filters += ' AND ca.crop_type_id = ?'; params.push(req.query.crop_type_id); }
    if (req.query.status) { filters += ' AND ca.status = ?'; params.push(req.query.status); }
    if (req.query.start_date) { filters += ' AND ca.planting_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND ca.planting_date <= ?'; params.push(req.query.end_date); }
    const countQuery = `SELECT COUNT(*) as total FROM crop_activities ca WHERE ca.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `
      SELECT ca.*, ct.name as crop_name, la.name as land_name
      FROM crop_activities ca
      JOIN crop_types ct ON ca.crop_type_id = ct.id
      JOIN land_areas la ON ca.land_area_id = la.id
      WHERE ca.deleted_at IS NULL ${where} ${filters}
      ORDER BY ca.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createCropActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { crop_type_id, land_area_id, planting_date, harvest_date, quantity_planted, quantity_harvested, status, diseases, sales_amount, notes } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO crop_activities (crop_type_id, land_area_id, planting_date, harvest_date, quantity_planted, quantity_harvested, status, diseases, sales_amount, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [crop_type_id, land_area_id, planting_date, harvest_date, quantity_planted, quantity_harvested, status || 'planted', diseases, sales_amount || 0, notes]
    );
    await logAudit(req, createAuditEntry(req, 'Create Crop Activity', 'CropActivities', `Crop activity created`));
    return created(res, { id: result.insertId }, 'Crop activity created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateCropActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { crop_type_id, land_area_id, planting_date, harvest_date, quantity_planted, quantity_harvested, status, diseases, sales_amount, notes } = req.body;
    await pool.query(
      'UPDATE crop_activities SET crop_type_id=?, land_area_id=?, planting_date=?, harvest_date=?, quantity_planted=?, quantity_harvested=?, status=?, diseases=?, sales_amount=?, notes=? WHERE id=?',
      [crop_type_id, land_area_id, planting_date, harvest_date, quantity_planted, quantity_harvested, status, diseases, sales_amount, notes, req.params.id]
    );
    return success(res, null, 'Crop activity updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteCropActivity = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE crop_activities SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Crop activity deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getCropDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [[{ totalCrops }]]: any = await pool.query('SELECT COUNT(*) as totalCrops FROM crop_types WHERE deleted_at IS NULL');
    const [[{ totalLand }]]: any = await pool.query('SELECT COUNT(*) as totalLand FROM land_areas WHERE deleted_at IS NULL');
    const [[{ totalPlanted }]]: any = await pool.query("SELECT COUNT(*) as totalPlanted FROM crop_activities WHERE deleted_at IS NULL AND status = 'planted'");
    const [[{ totalHarvested }]]: any = await pool.query("SELECT COUNT(*) as totalHarvested FROM crop_activities WHERE deleted_at IS NULL AND status = 'harvested'");
    const [[{ notMatured }]]: any = await pool.query("SELECT COUNT(*) as notMatured FROM crop_activities WHERE deleted_at IS NULL AND status = 'growing'");
    const [recent] = await pool.query(`
      SELECT ca.*, ct.name as crop_name, la.name as land_name
      FROM crop_activities ca
      JOIN crop_types ct ON ca.crop_type_id = ct.id
      JOIN land_areas la ON ca.land_area_id = la.id
      WHERE ca.deleted_at IS NULL ORDER BY ca.created_at DESC LIMIT 10`);
    return success(res, { totalCrops, totalLand, totalPlanted, totalHarvested, notMatured, recent });
  } catch (err: any) { return error(res, err.message); }
};
