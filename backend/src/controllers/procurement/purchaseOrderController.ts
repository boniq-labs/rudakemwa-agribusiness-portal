import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getPurchaseOrders = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);
    let filters = '';
    if (req.query.status) { filters += ' AND po.status = ?'; params.push(req.query.status); }
    if (req.query.supplier_id) { filters += ' AND po.supplier_id = ?'; params.push(req.query.supplier_id); }
    const countQuery = `SELECT COUNT(*) as total FROM purchase_orders po WHERE po.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT po.*, s.supplier_name as supplier FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, request_id, order_date, expected_delivery, items, notes } = req.body;
    const po_number = `PO-${Date.now()}`;
    const [result]: any = await pool.query(
      'INSERT INTO purchase_orders (po_number, supplier_id, request_id, order_date, expected_delivery, notes, status, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [po_number, supplier_id, request_id || null, order_date || null, expected_delivery || null, notes || null, 'pending', req.user?.id]
    );
    const orderId = result.insertId;
    if (items && items.length > 0) {
      for (const item of items) {
        const total_price = (item.quantity || 0) * (item.unit_price || 0);
        await pool.query(
          'INSERT INTO purchase_order_items (po_id, item_name, description, quantity, unit, unit_price, total_price) VALUES (?,?,?,?,?,?,?)',
          [orderId, item.item_name, item.description || null, item.quantity, item.unit || null, item.unit_price || 0, total_price]
        );
      }
    }
    await logAudit(req, createAuditEntry(req, 'Create Purchase Order', 'PurchaseOrders', `Order #${orderId} created`));
    return created(res, { id: orderId }, 'Purchase order created');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, request_id, order_date, expected_delivery, status, notes } = req.body;
    const [old]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (old.length === 0) return error(res, 'Purchase order not found', 404);
    await pool.query(
      'UPDATE purchase_orders SET supplier_id=?, request_id=?, order_date=?, expected_delivery=?, status=?, notes=? WHERE id=?',
      [supplier_id, request_id || null, order_date || null, expected_delivery || null, status || 'draft', notes || null, req.params.id]
    );
    return success(res, null, 'Purchase order updated');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Purchase order not found', 404);
    await pool.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, null, 'Purchase order status updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Purchase order not found', 404);
    await pool.query('UPDATE purchase_orders SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Purchase order deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const receivePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Purchase order not found', 404);
    await pool.query('UPDATE purchase_orders SET status = ?, received_at = NOW() WHERE id = ?', ['received', req.params.id]);
    const items: any = await pool.query('SELECT * FROM purchase_order_items WHERE po_id = ?', [req.params.id]);
    for (const item of items[0]) {
      if (item.item_name) {
        const [inv]: any = await pool.query('SELECT id FROM inventory_items WHERE name = ? AND deleted_at IS NULL LIMIT 1', [item.item_name]);
        if (inv.length > 0) {
          await pool.query('UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?', [item.quantity, inv[0].id]);
        }
      }
    }
    return success(res, null, 'Purchase order received');
  } catch (err: any) { return error(res, err.message); }
};
