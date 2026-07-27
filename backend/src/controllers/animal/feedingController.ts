import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getFeedingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.group_id; delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND f.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.group_id) { filters += ' AND f.group_id = ?'; params.push(req.query.group_id); }
    if (req.query.start_date) { filters += ' AND f.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND f.date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM feeding_records f WHERE f.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT f.*, a.tag_number, a.name as animal_name
      FROM feeding_records f
      LEFT JOIN animals a ON f.animal_id = a.id
      WHERE f.deleted_at IS NULL ${where} ${filters}
      ORDER BY f.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createFeedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, feed_type, quantity, unit, date, notes } = req.body;
    if (!animal_id) return error(res, 'Animal is required', 400);

    const [result]: any = await pool.query(
      `INSERT INTO feeding_records (animal_id, feed_type, quantity, unit, date, notes) VALUES (?,?,?,?,?,?)`,
      [animal_id, feed_type, quantity, unit, date || new Date().toISOString().split('T')[0], notes]
    );

    await logAudit(req, createAuditEntry(req, 'Create Feeding Record', 'FeedingRecords', `Feeding record created`, { animal_id, feed_type, quantity, unit, date }));
    return created(res, { id: result.insertId }, 'Feeding record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateFeedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM feeding_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Feeding record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'feed_type', 'quantity', 'unit', 'date', 'notes'];
    const dateFields = new Set(['date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE feeding_records SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Feeding Record', 'FeedingRecords', `Updated feeding record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Feeding record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteFeedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM feeding_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Feeding record not found', 404);
    await pool.query('UPDATE feeding_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Feeding Record', 'FeedingRecords', `Deleted feeding record ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Feeding record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getFeedConsumptionReport = async (req: AuthRequest, res: Response) => {
  try {
    let filters = '';
    const params: any[] = [];

    if (req.query.start_date) { filters += ' AND date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND date <= ?'; params.push(req.query.end_date); }

    const [rows]: any = await pool.query(
      `SELECT feed_type, unit, SUM(quantity) as total_quantity, COUNT(*) as record_count
       FROM feeding_records
       WHERE deleted_at IS NULL ${filters}
       GROUP BY feed_type, unit
       ORDER BY total_quantity DESC`,
      params
    );

    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
