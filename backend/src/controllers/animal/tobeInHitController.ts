import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getTobeInHitRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_category_id; delete ff.animal_id; delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_category_id) { filters += ' AND t.animal_category_id = ?'; params.push(req.query.animal_category_id); }
    if (req.query.animal_id) { filters += ' AND t.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.start_date) { filters += ' AND t.tobe_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND t.tobe_date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM tobe_in_hit t WHERE 1=1 ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT t.*, ac.name as category_name, a.tag_number, a.name as animal_name
      FROM tobe_in_hit t
      LEFT JOIN animal_categories ac ON t.animal_category_id = ac.id
      LEFT JOIN animals a ON t.animal_id = a.id
      WHERE 1=1 ${filters}
      ORDER BY t.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createTobeInHitRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_category_id, animal_id, tobe_date } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO tobe_in_hit (animal_category_id, animal_id, tobe_date, created_by) VALUES (?,?,?,?)`,
      [animal_category_id || null, animal_id, tobe_date || null, req.user!.id]
    );
    await logAudit(req, createAuditEntry(req, 'Create TobeInHit', 'TobeInHit', `Tobe in hit recorded for animal ${animal_id}`, { animal_category_id, animal_id, tobe_date }));
    return created(res, { id: result.insertId }, 'Tobe in hit record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateTobeInHitRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM tobe_in_hit WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Tobe in hit record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_category_id', 'animal_id', 'tobe_date'];
    const dateFields = new Set(['tobe_date']);
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`);
        values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]);
      }
    }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE tobe_in_hit SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update TobeInHit', 'TobeInHit', `Updated tobe in hit ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Tobe in hit record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteTobeInHitRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM tobe_in_hit WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Tobe in hit record not found', 404);
    await pool.query('DELETE FROM tobe_in_hit WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete TobeInHit', 'TobeInHit', `Deleted tobe in hit ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Tobe in hit record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getTobeInHitReports = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (start_date) { where += ' AND t.tobe_date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND t.tobe_date <= ?'; params.push(end_date); }
    const [rows]: any = await pool.query(
      `SELECT t.*, ac.name as category_name, a.tag_number, a.name as animal_name
       FROM tobe_in_hit t
       LEFT JOIN animal_categories ac ON t.animal_category_id = ac.id
       LEFT JOIN animals a ON t.animal_id = a.id
       ${where} ORDER BY t.tobe_date DESC`,
      params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
