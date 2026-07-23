import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const receiveStock = async (req: AuthRequest, res: Response) => {
  try {
    const { item_id, quantity, unit_price, supplier_id, notes } = req.body;

    const [item]: any = await pool.query('SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
    if (item.length === 0) return error(res, 'Inventory item not found', 404);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE inventory_items SET quantity = quantity + ?, purchase_price = ? WHERE id = ?',
        [quantity, unit_price, item_id]
      );

      const [result]: any = await connection.query(
        `INSERT INTO stock_transactions (item_id, \`type\`, quantity, unit_price, supplier_id, notes) VALUES (?, 'receive', ?, ?, ?, ?)`,
        [item_id, quantity, unit_price, supplier_id, notes]
      );

      await connection.commit();

      await logAudit(req, createAuditEntry(req, 'Receive Stock', 'StockTransactions', `Received ${quantity} of item ${item_id}`, { item_id, quantity, unit_price, supplier_id }));
      return created(res, { id: result.insertId }, 'Stock received successfully');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) { return error(res, err.message); }
};

const sourceTables: Record<string, string> = {
  inventory: 'inventory_items',
  feed: 'feed_items',
  medicine: 'medicine_items',
  equipment: 'equipment',
};

async function findItem(sourceType: string, sourceId: number): Promise<any> {
  const table = sourceTables[sourceType];
  if (!table) return null;
  const [rows]: any = await pool.query(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`, [sourceId]);
  return rows[0] || null;
}

async function updateItemQuantity(sourceType: string, sourceId: number, newQty: number, connection?: any, invItemId?: number): Promise<void> {
  const table = sourceTables[sourceType];
  if (!table) throw new Error(`Unknown source type: ${sourceType}`);
  const q = connection || pool;
  await q.query(`UPDATE ${table} SET quantity = ? WHERE id = ?`, [newQty, sourceId]);
  if (sourceType !== 'inventory' && invItemId) {
    await q.query(`UPDATE inventory_items SET quantity = ? WHERE id = ?`, [newQty, invItemId]);
  }
}

export const getAllStockItems = async (req: AuthRequest, res: Response) => {
  try {
    const [feed]: any = await pool.query(
      "SELECT fi.id, fi.name, fi.quantity, COALESCE(fi.unit,'') as unit, 'feed' as source_type, fi.inventory_item_id FROM feed_items fi WHERE fi.deleted_at IS NULL"
    );
    const [medicine]: any = await pool.query(
      "SELECT mi.id, mi.name, mi.quantity, COALESCE(mi.unit,'') as unit, 'medicine' as source_type, mi.inventory_item_id FROM medicine_items mi WHERE mi.deleted_at IS NULL"
    );
    const [equipment]: any = await pool.query(
      "SELECT e.id, e.name, e.quantity, 'pcs' as unit, 'equipment' as source_type, e.inventory_item_id FROM equipment e WHERE e.deleted_at IS NULL"
    );
    const [inventory]: any = await pool.query(
      "SELECT ii.id, ii.name, ii.quantity, COALESCE(ii.unit,'') as unit, 'inventory' as source_type, ii.id as inventory_item_id FROM inventory_items ii WHERE ii.deleted_at IS NULL AND ii.id NOT IN (SELECT COALESCE(inventory_item_id,0) FROM feed_items WHERE inventory_item_id IS NOT NULL UNION SELECT COALESCE(inventory_item_id,0) FROM medicine_items WHERE inventory_item_id IS NOT NULL UNION SELECT COALESCE(inventory_item_id,0) FROM equipment WHERE inventory_item_id IS NOT NULL)"
    );
    const all = [...feed, ...medicine, ...equipment, ...inventory];
    return success(res, all);
  } catch (err: any) { return error(res, err.message); }
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);

    let extra = '';
    if (req.query.item_id) { extra += ' AND st.item_id = ?'; params.push(req.query.item_id); }
    if (req.query.start_date) { extra += ' AND st.created_at >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { extra += ' AND st.created_at <= ?'; params.push(req.query.end_date); }
    if (req.query.type) { extra += ' AND st.\`type\` = ?'; params.push(req.query.type); }

    const whereClause = `WHERE st.deleted_at IS NULL${where ? ' AND ' + where.replace(/^WHERE\s*/i, '') : ''}${extra}`;
    const countQuery = `SELECT COUNT(*) as total FROM stock_transactions st ${whereClause}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT st.*,
        COALESCE(sl_from.name, st.from_location_id) as from_location,
        COALESCE(sl_to.name, st.to_location_id) as to_location,
        ii.name as item_name, ii.code as item_code
      FROM stock_transactions st
      JOIN inventory_items ii ON st.item_id = ii.id
      LEFT JOIN stock_locations sl_from ON st.from_location_id = sl_from.id
      LEFT JOIN stock_locations sl_to ON st.to_location_id = sl_to.id
      ${whereClause}
      ORDER BY st.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    // Parse adjustment notes for structured data
    for (const row of rows) {
      if (row.type === 'adjustment' && row.notes) {
        try {
          const parsed = JSON.parse(row.notes);
          row.previous_quantity = parsed.previous_quantity;
          row.new_quantity = parsed.new_quantity;
          row.reason = parsed.reason;
          row.notes = parsed.notes || '';
        } catch {
          const m = row.notes.match(/\(old:\s*([\d.]+),\s*new:\s*([\d.]+)\)/);
          if (m) {
            row.previous_quantity = Number(m[1]);
            row.new_quantity = Number(m[2]);
            row.reason = row.notes.replace(/\s*\(old:.*$/, '');
          }
        }
      }
    }

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};
