import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getWasteRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND wr.created_at >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND wr.created_at <= ?'; params.push(req.query.end_date); }
    if (req.query.reason) { filters += ' AND wr.reason = ?'; params.push(req.query.reason); }

    const countQuery = `SELECT COUNT(*) as total FROM milk_waste_records wr WHERE wr.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT wr.*, mc.collection_date, mc.time
      FROM milk_waste_records wr
      LEFT JOIN milk_collections mc ON wr.collection_id = mc.id
      WHERE wr.deleted_at IS NULL ${where} ${filters}
      ORDER BY wr.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createWasteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { collection_id, quantity_liters, reason, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO milk_waste_records (collection_id, quantity_liters, reason, notes) VALUES (?,?,?,?)`,
      [collection_id, quantity_liters, reason, notes]
    );

    await pool.query(
      `UPDATE milk_storage SET status = 'wasted' WHERE collection_id = ? AND status = 'stored' AND deleted_at IS NULL`,
      [collection_id]
    );

    await logAudit(req, createAuditEntry(req, 'Create Waste Record', 'MilkWaste', `Recorded ${quantity_liters}L waste: ${reason}`, { collection_id, quantity_liters, reason }));
    return created(res, { id: result.insertId }, 'Waste record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateWasteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { collection_id, quantity_liters, reason, notes } = req.body;

    const [old]: any = await pool.query('SELECT * FROM milk_waste_records WHERE id = ?', [id]);
    if (old.length === 0) return error(res, 'Waste record not found', 404);

    await pool.query(
      `UPDATE milk_waste_records SET collection_id=?, quantity_liters=?, reason=?, notes=?, updated_at=NOW() WHERE id=?`,
      [collection_id, quantity_liters, reason, notes, id]
    );

    const [updated]: any = await pool.query('SELECT * FROM milk_waste_records WHERE id = ?', [id]);

    await logAudit(req, createAuditEntry(req, 'Update Waste Record', 'MilkWaste', `Updated waste record ${id}`, req.body, old[0]));
    return success(res, updated[0]);
  } catch (err: any) { return error(res, err.message); }
};

export const deleteWasteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [old]: any = await pool.query('SELECT * FROM milk_waste_records WHERE id = ?', [id]);
    if (old.length === 0) return error(res, 'Waste record not found', 404);

    await pool.query('UPDATE milk_waste_records SET deleted_at = NOW() WHERE id = ?', [id]);

    await logAudit(req, createAuditEntry(req, 'Delete Waste Record', 'MilkWaste', `Deleted waste record ${id}`, null, old[0]));
    return success(res, { message: 'Waste record deleted' });
  } catch (err: any) { return error(res, err.message); }
};
