import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getProductCategories = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM product_categories ORDER BY name');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createProductCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const [result]: any = await pool.query('INSERT INTO product_categories (name, description) VALUES (?,?)', [name, description]);
    await logAudit(req, createAuditEntry(req, 'Create Product Category', 'Sales', `Product category ${name} created`, req.body));
    return created(res, { id: result.insertId }, 'Product category created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProductCategory = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM product_categories WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Product category not found', 404);
    const { name, description } = req.body;
    await pool.query('UPDATE product_categories SET name=?, description=? WHERE id=?', [name, description, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Update Product Category', 'Sales', `Product category #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Product category updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, search, status } = req.query;
    let where = 'WHERE p.deleted_at IS NULL';
    const params: any[] = [];
    if (category_id) { where += ' AND p.category_id = ?'; params.push(category_id); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (search) { where += ' AND (p.name LIKE ? OR p.code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const [rows]: any = await pool.query(
      `SELECT p.*, pc.name as category_name
       FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id
       ${where} ORDER BY p.created_at DESC`, params
    );
    const sanitized = rows.map((r: any) => ({ ...r, quantity_available: Number(r.quantity_available) || 0, price: Number(r.price) || 0 }));
    return success(res, sanitized);
  } catch (err: any) { return error(res, err.message); }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    let category_id = b.category_id || b.category || null;
    if (!category_id && b.category_name) {
      const [existing]: any = await pool.query('SELECT id FROM product_categories WHERE name = ?', [b.category_name]);
      if (existing.length > 0) {
        category_id = existing[0].id;
      } else {
        const [result]: any = await pool.query('INSERT INTO product_categories (name) VALUES (?)', [b.category_name]);
        category_id = result.insertId;
      }
    }
    const quantity_available = b.quantity_available ?? b.quantity ?? 0;
    const { name, code, unit, price, cost_price, description } = b;
    const [result]: any = await pool.query(
      `INSERT INTO products (category_id, name, code, unit, price, cost_price, quantity_available, description)
       VALUES (?,?,?,?,?,?,?,?)`,
      [category_id || null, name, code || null, unit || null, price, cost_price || null, quantity_available, description || null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Product', 'Sales', `Product ${name} created`, req.body));
    return created(res, { id: result.insertId }, 'Product created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Product not found', 404);
    const b = req.body;
    let category_id = b.category_id || b.category || null;
    if (!category_id && b.category_name) {
      const [existing]: any = await pool.query('SELECT id FROM product_categories WHERE name = ?', [b.category_name]);
      if (existing.length > 0) {
        category_id = existing[0].id;
      } else {
        const [result]: any = await pool.query('INSERT INTO product_categories (name) VALUES (?)', [b.category_name]);
        category_id = result.insertId;
      }
    }
    const quantity_available = b.quantity_available ?? b.quantity ?? old[0].quantity_available;
    const { name, code, unit, price, cost_price, description, status } = b;
    await pool.query(
      `UPDATE products SET category_id=?, name=?, code=?, unit=?, price=?, cost_price=?, quantity_available=?, description=?, status=? WHERE id=?`,
      [category_id, name, code || null, unit || null, price, cost_price || null, quantity_available, description || null, status || old[0].status, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Product', 'Sales', `Product #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Product updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Product not found', 404);
    await pool.query('UPDATE products SET deleted_at = NOW(), status = ? WHERE id = ?', ['inactive', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Product', 'Sales', `Product #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Product deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const [old]: any = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Product not found', 404);
    const newQty = Number(old[0].quantity_available) + Number(quantity);
    await pool.query('UPDATE products SET quantity_available = ? WHERE id = ?', [newQty, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Update Stock', 'Sales', `Product #${req.params.id} stock adjusted by ${quantity}`, req.body, old[0]));
    return success(res, { quantity_available: newQty }, 'Stock updated');
  } catch (err: any) { return error(res, err.message); }
};
