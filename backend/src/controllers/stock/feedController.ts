import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
import { createNotification } from '../notificationController';

export const getFeedItems = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name', 'code']);

    let filters = '';
    if (req.query.category) { filters += ' AND category = ?'; params.push(req.query.category); }
    if (req.query.low_stock === 'true') { filters += ' AND quantity <= min_stock_level'; }

    const countQuery = `SELECT COUNT(*) as total FROM feed_items WHERE deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `SELECT * FROM feed_items WHERE deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createFeedItem = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, unit, quantity, min_stock_level, max_stock_level, purchase_price, notes } = req.body;
    const supplier_name = req.body.supplier_name || '';

    const [result]: any = await pool.query(
      `INSERT INTO feed_items (name, code, category, unit, quantity, min_stock_level, max_stock_level, purchase_price, supplier_name, notes) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [name, code, category, unit, quantity, min_stock_level, max_stock_level, purchase_price, supplier_name, notes]
    );

    await logAudit(req, createAuditEntry(req, 'Create Feed Item', 'FeedItems', `Feed item ${name} created`, { name, code, category }));
    return created(res, { id: result.insertId }, 'Feed item created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateFeedItem = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, unit, quantity, min_stock_level, max_stock_level, purchase_price, notes } = req.body;
    const supplier_name = req.body.supplier_name || '';

    const [old]: any = await pool.query('SELECT * FROM feed_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Feed item not found', 404);

    await pool.query(
      `UPDATE feed_items SET name=?, code=?, category=?, unit=?, quantity=?, min_stock_level=?, max_stock_level=?, purchase_price=?, supplier_name=?, notes=? WHERE id=?`,
      [name, code, category, unit, quantity, min_stock_level, max_stock_level, purchase_price, supplier_name, notes, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Feed Item', 'FeedItems', `Updated feed item ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Feed item updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteFeedItem = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE feed_items SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Feed item deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getFeedConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND fc.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND fc.date <= ?'; params.push(req.query.end_date); }
    if (req.query.animal_group_id) { filters += ' AND fc.animal_group_id = ?'; params.push(req.query.animal_group_id); }

    const countQuery = `SELECT COUNT(*) as total FROM feed_consumption fc WHERE 1=1 ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT fc.*, fi.name as feed_name, fi.code as feed_code, fi.unit,
             ag.name as animal_group_name
      FROM feed_consumption fc
      JOIN feed_items fi ON fc.feed_item_id = fi.id
      LEFT JOIN animal_groups ag ON fc.animal_group_id = ag.id
      WHERE 1=1 ${where} ${filters}
      ORDER BY fc.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const recordFeedConsumption = async (req: AuthRequest, res: Response) => {
  try {
    const { feed_item_id, animal_group_id, quantity, date, notes } = req.body;

    const [item]: any = await pool.query('SELECT * FROM feed_items WHERE id = ? AND deleted_at IS NULL', [feed_item_id]);
    if (item.length === 0) return error(res, 'Feed item not found', 404);
    if (Number(item[0].quantity) < Number(quantity)) return error(res, 'Insufficient feed quantity', 400);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE feed_items SET quantity = quantity - ? WHERE id = ?', [quantity, feed_item_id]);

      const [result]: any = await connection.query(
        `INSERT INTO feed_consumption (feed_item_id, animal_group_id, quantity, date, notes) VALUES (?,?,?,?,?)`,
        [feed_item_id, animal_group_id, quantity, date, notes]
      );

      await connection.commit();

      await logAudit(req, createAuditEntry(req, 'Record Feed Consumption', 'FeedConsumption', `Consumed ${quantity} of feed ${feed_item_id}`, { feed_item_id, animal_group_id, quantity }));
      const [updated]: any = await connection.query('SELECT name, quantity, min_stock_level FROM feed_items WHERE id = ?', [feed_item_id]);
      if (updated.length > 0 && Number(updated[0].quantity) <= Number(updated[0].min_stock_level)) {
        try { await createNotification(req.user!.id, 'warning', 'Low Feed Stock', `Feed "${updated[0].name}" is low (${updated[0].quantity} remaining)`); } catch {}
      }
      return created(res, { id: result.insertId }, 'Feed consumption recorded');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) { return error(res, err.message); }
};

export const getFeedStockReport = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT category, COUNT(*) as item_count,
              SUM(quantity) as total_quantity,
              SUM(min_stock_level) as total_min_stock,
              SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
              SUM(quantity * purchase_price) as total_value
       FROM feed_items
       WHERE deleted_at IS NULL
       GROUP BY category
       ORDER BY category`
    );

    const [summary]: any = await pool.query(
      `SELECT COUNT(*) as total_items, SUM(quantity) as total_quantity, SUM(quantity * purchase_price) as total_value
       FROM feed_items WHERE deleted_at IS NULL`
    );

    return success(res, { summary: summary[0], byCategory: rows });
  } catch (err: any) { return error(res, err.message); }
};
