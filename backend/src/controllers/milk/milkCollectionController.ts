import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
import { createNotification } from '../notificationController';

export const getMilkCollections = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    // Strip manually-handled keys to avoid duplicate WHERE
    ['start_date', 'end_date', 'collector_id', 'time', 'branch_id'].forEach(k => delete pag.filters[k]);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND mc.collection_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND mc.collection_date <= ?'; params.push(req.query.end_date); }
    if (req.query.collector_id) { filters += ' AND mc.collector_id = ?'; params.push(req.query.collector_id); }
    if (req.query.time) { filters += ' AND mc.time = ?'; params.push(req.query.time); }
    if (req.query.branch_id) { filters += ' AND mc.branch_id = ?'; params.push(req.query.branch_id); }

    const countQuery = `SELECT COUNT(*) as total FROM milk_collections mc WHERE mc.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT mc.*, COALESCE(mc.collector_name, u.first_name) as collector_name, b.name as branch_name
      FROM milk_collections mc
      LEFT JOIN users u ON mc.collector_id = u.id
      LEFT JOIN branches b ON mc.branch_id = b.id
      WHERE mc.deleted_at IS NULL ${where} ${filters}
      ORDER BY mc.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createMilkCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { collection_date, time, collector_name, collector_id, branch_id, quantity_liters, number_of_animals, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO milk_collections (collection_date, time, collector_id, collector_name, branch_id, quantity_liters, number_of_animals, notes) VALUES (?,?,?,?,?,?,?,?)`,
      [collection_date, time, collector_id || null, collector_name || null, branch_id, quantity_liters, number_of_animals, notes]
    );

    await logAudit(req, createAuditEntry(req, 'Create Milk Collection', 'MilkCollections', `Collection of ${quantity_liters}L created`, { collection_date, time, collector_name, collector_id, branch_id, quantity_liters }));
    try { await createNotification(req.user!.id, 'info', 'Milk Production', `${quantity_liters}L of milk collected (${time})`); } catch {}
    return created(res, { id: result.insertId }, 'Milk collection created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateMilkCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { collection_date, time, collector_name, collector_id, branch_id, quantity_liters, number_of_animals, notes } = req.body;

    const [old]: any = await pool.query('SELECT * FROM milk_collections WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Milk collection not found', 404);

    await pool.query(
      `UPDATE milk_collections SET collection_date=?, time=?, collector_id=?, collector_name=?, branch_id=?, quantity_liters=?, number_of_animals=?, notes=? WHERE id=?`,
      [collection_date, time, collector_id || null, collector_name || null, branch_id, quantity_liters, number_of_animals, notes, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Milk Collection', 'MilkCollections', `Updated collection ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Milk collection updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteMilkCollection = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM milk_collections WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Milk collection not found', 404);

    await pool.query('UPDATE milk_collections SET deleted_at = NOW() WHERE id = ?', [req.params.id]);

    await logAudit(req, createAuditEntry(req, 'Delete Milk Collection', 'MilkCollections', `Deleted collection ${req.params.id}`, null, old[0]));
    return success(res, null, 'Milk collection deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getDailyProduction = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    const [rows]: any = await pool.query(
      `SELECT time, SUM(quantity_liters) as total_liters, COUNT(*) as collection_count,
              SUM(number_of_animals) as total_animals
       FROM milk_collections
       WHERE collection_date = ? AND deleted_at IS NULL
       GROUP BY time`,
      [date]
    );

    const morning = rows.find((r: any) => r.time === 'morning');
    const evening = rows.find((r: any) => r.time === 'evening');

    return success(res, {
      date,
      morning: morning ? { liters: Number(morning.total_liters), count: morning.collection_count, animals: Number(morning.total_animals) } : { liters: 0, count: 0, animals: 0 },
      evening: evening ? { liters: Number(evening.total_liters), count: evening.collection_count, animals: Number(evening.total_animals) } : { liters: 0, count: 0, animals: 0 },
      total: Number(morning?.total_liters || 0) + Number(evening?.total_liters || 0)
    });
  } catch (err: any) { return error(res, err.message); }
};

export const getMonthlyProduction = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query;

    const [rows]: any = await pool.query(
      `SELECT collection_date, time, SUM(quantity_liters) as total_liters
       FROM milk_collections
       WHERE DATE_FORMAT(collection_date, '%Y-%m') = ? AND deleted_at IS NULL
       GROUP BY collection_date, time
       ORDER BY collection_date ASC`,
      [month]
    );

    const daily: any = {};
    for (const row of rows) {
      const d = row.collection_date;
      if (!daily[d]) daily[d] = { date: d, morning: 0, evening: 0, total: 0 };
      daily[d][row.time] = Number(row.total_liters);
      daily[d].total += Number(row.total_liters);
    }

    return success(res, { month, dailyProduction: Object.values(daily) });
  } catch (err: any) { return error(res, err.message); }
};
