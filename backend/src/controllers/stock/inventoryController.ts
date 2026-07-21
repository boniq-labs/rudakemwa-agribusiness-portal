import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getInventoryCategories = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name']);

    const countQuery = `SELECT COUNT(*) as total FROM inventory_categories WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `SELECT * FROM inventory_categories WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createInventoryCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const [existing]: any = await pool.query('SELECT id FROM inventory_categories WHERE name = ?', [name]);
    if (existing.length > 0) return error(res, 'Category already exists', 400);

    const [result]: any = await pool.query(
      'INSERT INTO inventory_categories (name, description) VALUES (?,?)',
      [name, description]
    );

    await logAudit(req, createAuditEntry(req, 'Create Inventory Category', 'InventoryCategories', `Category ${name} created`, { name, description }));
    return created(res, { id: result.insertId }, 'Inventory category created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateInventoryCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const [old]: any = await pool.query('SELECT * FROM inventory_categories WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Category not found', 404);

    await pool.query(
      'UPDATE inventory_categories SET name=?, description=? WHERE id=?',
      [name, description, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Inventory Category', 'InventoryCategories', `Updated category ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Inventory category updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['ii.name', 'ii.code']);

    let filters = '';
    if (req.query.category_id) { filters += ' AND ii.category_id = ?'; params.push(req.query.category_id); }
    if (req.query.low_stock === 'true') { filters += ' AND ii.quantity <= ii.min_stock_level'; }
    if (req.query.location_id) { filters += ' AND ii.location_id = ?'; params.push(req.query.location_id); }

    const countQuery = `SELECT COUNT(*) as total FROM inventory_items ii WHERE ii.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT ii.*, ic.name as category_name, l.name as location_name, s.supplier_name as supplier_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN stock_locations l ON ii.location_id = l.id
      LEFT JOIN suppliers s ON ii.supplier_id = s.id
      WHERE ii.deleted_at IS NULL ${where} ${filters}
      ORDER BY ii.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, code, barcode, unit, quantity, min_stock_level, max_stock_level, purchase_price, location_id, supplier_id } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO inventory_items (category_id, name, code, barcode, unit, quantity, min_stock_level, max_stock_level, purchase_price, location_id, supplier_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id, name, code, barcode, unit, quantity, min_stock_level, max_stock_level, purchase_price, location_id, supplier_id]
    );

    await logAudit(req, createAuditEntry(req, 'Create Inventory Item', 'InventoryItems', `Item ${name} created`, { category_id, name, code, quantity }));
    return created(res, { id: result.insertId }, 'Inventory item created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, code, barcode, unit, quantity, min_stock_level, max_stock_level, purchase_price, location_id, supplier_id } = req.body;

    const [old]: any = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Inventory item not found', 404);

    await pool.query(
      `UPDATE inventory_items SET category_id=?, name=?, code=?, barcode=?, unit=?, quantity=?, min_stock_level=?, max_stock_level=?, purchase_price=?, location_id=?, supplier_id=? WHERE id=?`,
      [category_id, name, code, barcode, unit, quantity, min_stock_level, max_stock_level, purchase_price, location_id, supplier_id, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Inventory Item', 'InventoryItems', `Updated item ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Inventory item updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Inventory item not found', 404);

    await pool.query('UPDATE inventory_items SET deleted_at = NOW() WHERE id = ?', [req.params.id]);

    await logAudit(req, createAuditEntry(req, 'Delete Inventory Item', 'InventoryItems', `Deleted item ${old[0].name}`, null, old[0]));
    return success(res, null, 'Inventory item deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getLowStockItems = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT ii.*, ic.name as category_name
       FROM inventory_items ii
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       WHERE ii.deleted_at IS NULL AND ii.quantity <= ii.min_stock_level
       ORDER BY (ii.quantity / ii.min_stock_level) ASC`
    );

    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getStockValue = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT SUM(ii.quantity * ii.purchase_price) as total_value,
              COUNT(*) as total_items,
              SUM(ii.quantity) as total_quantity
       FROM inventory_items ii
       WHERE ii.deleted_at IS NULL`
    );

    const [byCategory]: any = await pool.query(
      `SELECT ic.name as category, SUM(ii.quantity * ii.purchase_price) as value, COUNT(*) as items
       FROM inventory_items ii
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       WHERE ii.deleted_at IS NULL
       GROUP BY ic.name`
    );

    return success(res, { summary: rows[0], byCategory });
  } catch (err: any) { return error(res, err.message); }
};
