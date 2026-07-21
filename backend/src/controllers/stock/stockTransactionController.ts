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

export const issueStock = async (req: AuthRequest, res: Response) => {
  try {
    const { item_id, source_type, source_id, quantity, issued_to, department_id, notes } = req.body;
    const actualSourceType = source_type || 'inventory';
    const actualSourceId = source_id || item_id;

    const item = await findItem(actualSourceType, actualSourceId);
    if (!item) return error(res, 'Stock item not found', 404);

    if (Number(item.quantity) < Number(quantity)) {
      return error(res, `Insufficient stock for item ${item.name}`, 400);
    }

    const newQty = Number(item.quantity) - Number(quantity);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const invItemId = item.inventory_item_id || actualSourceId;
      await updateItemQuantity(actualSourceType, actualSourceId, newQty, connection, actualSourceType !== 'inventory' ? invItemId : undefined);
      const issueNotes = [notes, issued_to ? `Issued to: ${issued_to}` : ''].filter(Boolean).join(' | ');
      const [result]: any = await connection.query(
        `INSERT INTO stock_transactions (item_id, \`type\`, quantity, department_id, notes, reference_type, reference_id) VALUES (?, 'issue', ?, ?, ?, ?, ?)`,
        [invItemId, quantity, department_id, issueNotes || null, actualSourceType, actualSourceId]
      );
      await connection.commit();
      await logAudit(req, createAuditEntry(req, 'Issue Stock', 'StockTransactions', `Issued ${quantity} of ${item.name}`, { source_type: actualSourceType, source_id: actualSourceId, quantity, department_id }));
      return created(res, { id: result.insertId }, 'Stock issued successfully');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) { return error(res, err.message); }
};

export const transferStock = async (req: AuthRequest, res: Response) => {
  try {
    const { item_id, source_type, source_id, from_location, to_location, quantity, notes } = req.body;
    const actualSourceType = source_type || 'inventory';
    const actualSourceId = source_id || item_id;

    const item = await findItem(actualSourceType, actualSourceId);
    if (!item) return error(res, 'Stock item not found', 404);

    if (Number(item.quantity) < Number(quantity)) return error(res, 'Insufficient stock for transfer', 400);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const invItemId = item.inventory_item_id || actualSourceId;
      const [result]: any = await connection.query(
        `INSERT INTO stock_transactions (item_id, \`type\`, quantity, notes, from_location_id, to_location_id, reference_type, reference_id) VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?)`,
        [invItemId, quantity, notes, from_location, to_location, actualSourceType, actualSourceId]
      );
      await connection.commit();
      await logAudit(req, createAuditEntry(req, 'Transfer Stock', 'StockTransactions', `Transferred ${quantity} of ${item.name} from ${from_location} to ${to_location}`, { source_type: actualSourceType, source_id: actualSourceId, from_location, to_location, quantity }));
      return success(res, { id: result.insertId }, 'Stock transferred successfully');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) { return error(res, err.message); }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { item_id, source_type, source_id, new_quantity, reason, notes } = req.body;
    const actualSourceType = source_type || 'inventory';
    const actualSourceId = source_id || item_id;

    const item = await findItem(actualSourceType, actualSourceId);
    if (!item) return error(res, 'Stock item not found', 404);

    const oldQuantity = Number(item.quantity);
    const diff = Number(new_quantity) - oldQuantity;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const invItemId = item.inventory_item_id || actualSourceId;
      await updateItemQuantity(actualSourceType, actualSourceId, Number(new_quantity), connection, actualSourceType !== 'inventory' ? invItemId : undefined);
      const [result]: any = await connection.query(
        `INSERT INTO stock_transactions (item_id, \`type\`, quantity, notes, reference_type, reference_id) VALUES (?, 'adjustment', ?, ?, ?, ?)`,
        [invItemId, diff, notes || `${reason} (old: ${oldQuantity}, new: ${new_quantity})`, actualSourceType, actualSourceId]
      );
      await connection.commit();
      await logAudit(req, createAuditEntry(req, 'Adjust Stock', 'StockTransactions', `Adjusted ${item.name} from ${oldQuantity} to ${new_quantity}`, { source_type: actualSourceType, source_id: actualSourceId, oldQuantity, new_quantity, reason }));
      return success(res, { id: result.insertId, old_quantity: oldQuantity, new_quantity: new_quantity, difference: diff }, 'Stock adjusted successfully');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
      SELECT st.*, ii.name as item_name, ii.code as item_code
      FROM stock_transactions st
      JOIN inventory_items ii ON st.item_id = ii.id
      ${whereClause}
      ORDER BY st.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};
