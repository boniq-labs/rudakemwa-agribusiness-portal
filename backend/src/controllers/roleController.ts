import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, created, error } from '../utils/response';

export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, description, is_system, created_at FROM roles ORDER BY name');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    const [result]: any = await pool.query('INSERT INTO roles (name, slug, description) VALUES (?,?,?)', [name, slug, description || null]);
    return created(res, { id: result.insertId, name, slug, description }, 'Role created');
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Role name or slug already exists', 400);
    return error(res, err.message);
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    const [existing]: any = await pool.query('SELECT id, is_system FROM roles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Role not found', 404);
    if (existing[0].is_system) return error(res, 'Cannot modify system roles', 403);
    await pool.query('UPDATE roles SET name = ?, slug = ?, description = ? WHERE id = ?', [name, slug, description || null, req.params.id]);
    return success(res, null, 'Role updated');
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Role name or slug already exists', 400);
    return error(res, err.message);
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT id, is_system FROM roles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return error(res, 'Role not found', 404);
    if (rows[0].is_system) return error(res, 'Cannot delete system roles', 403);
    await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    return success(res, null, 'Role deleted');
  } catch (err: any) { return error(res, err.message); }
};
