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
    const dataQuery = `SELECT po.*, s.supplier_name as supplier,
        pr.request_number,
        (SELECT GROUP_CONCAT(item_name SEPARATOR ', ') FROM purchase_order_items WHERE po_id = po.id) as item_name,
        (SELECT GROUP_CONCAT(item_name SEPARATOR ', ') FROM purchase_request_items WHERE request_id = pr.id) as request_items,
        (SELECT COALESCE(SUM(total_price),0) FROM purchase_order_items WHERE po_id = po.id) as item_total,
        COALESCE(po.total_cost, (SELECT COALESCE(SUM(total_price),0) FROM purchase_order_items WHERE po_id = po.id)) as total_cost
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_requests pr ON po.request_id = pr.id
        WHERE po.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, request_id, order_date, expected_delivery, items, notes, cost, status } = req.body;
    const po_number = `PO-${Date.now()}`;
    let totalCost = cost != null ? Number(cost) : (items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
    const orderDate = order_date || new Date().toISOString().split('T')[0];
    const [result]: any = await pool.query(
      'INSERT INTO purchase_orders (po_number, supplier_id, request_id, order_date, expected_delivery, notes, status, total_cost, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [po_number, supplier_id, request_id || null, orderDate, expected_delivery || null, notes || null, status || 'pending', totalCost || null, req.user?.id]
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

    // Create a PENDING expense linked to this purchase order.
    // Total comes from the entered cost; fall back to PO items sum, then to the linked request's estimated cost.
    if (totalCost <= 0 && request_id) {
      const [[est]]: any = await pool.query(
        'SELECT COALESCE(SUM(quantity * estimated_price),0) as est FROM purchase_request_items WHERE request_id = ?', [request_id]
      );
      totalCost = Number(est?.est) || 0;
    }
    if (totalCost > 0) {
      const [supplier]: any = await pool.query('SELECT supplier_name FROM suppliers WHERE id = ?', [supplier_id]);
      let [catRows]: any = await pool.query('SELECT id FROM expense_categories WHERE name = ? LIMIT 1', ['Purchases']);
      let categoryId: number;
      if (catRows.length === 0) {
        const [catResult]: any = await pool.query('INSERT INTO expense_categories (name, description) VALUES (?,?)', ['Purchases', 'Procurement purchases from suppliers']);
        categoryId = catResult.insertId;
      } else {
        categoryId = catRows[0].id;
      }
      await pool.query(
        `INSERT INTO expense_records (expense_number, category_id, description, amount, payment_method, vendor, notes, date, department_id, created_by, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [`EXP-PUR-${Date.now()}`, categoryId, `Purchase from ${supplier[0]?.supplier_name || 'Supplier'}`, totalCost, 'Cash', supplier[0]?.supplier_name || 'Supplier', `Pending expense for purchase order ${po_number}`, orderDate, null, req.user?.id, 'pending']
      );
    }

    return created(res, { id: orderId }, 'Purchase order created');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, request_id, order_date, expected_delivery, status, notes, cost } = req.body;
    const [old]: any = await pool.query('SELECT * FROM purchase_orders WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (old.length === 0) return error(res, 'Purchase order not found', 404);
    const totalCost = cost != null ? Number(cost) : old[0].total_cost;
    const orderDate = order_date || (old[0].order_date instanceof Date ? old[0].order_date.toISOString().split('T')[0] : old[0].order_date) || new Date().toISOString().split('T')[0];
    await pool.query(
      'UPDATE purchase_orders SET supplier_id=?, request_id=?, order_date=?, expected_delivery=?, status=?, notes=?, total_cost=? WHERE id=?',
      [supplier_id, request_id || null, orderDate, expected_delivery || null, status || 'draft', notes || null, totalCost, req.params.id]
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
    // NOTE: A PENDING expense is created when the purchase order is created.
    // Receiving does NOT insert a new expense here to avoid double-counting;
    // the existing pending expense is confirmed by the Accounting Manager via
    // PUT /api/accounting/expenses/:id/confirm.
    return success(res, null, 'Purchase order received');
  } catch (err: any) { return error(res, err.message); }
};

export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['po.po_number', 's.supplier_name']);
    let filters = " AND po.status IN ('received','completed')";
    if (req.query.department_id) { filters += ' AND po.department_id = ?'; params.push(req.query.department_id); }
    if (req.query.supplier_id) { filters += ' AND po.supplier_id = ?'; params.push(req.query.supplier_id); }
    const countQuery = `SELECT COUNT(*) as total FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT po.*, s.supplier_name, d.name as department_name,
        (SELECT COALESCE(SUM(total_price),0) FROM purchase_order_items WHERE po_id = po.id) as item_total,
        COALESCE(po.total_cost, (SELECT COALESCE(SUM(total_price),0) FROM purchase_order_items WHERE po_id = po.id)) as total_cost
        FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN departments d ON po.department_id = d.id
        WHERE po.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};
