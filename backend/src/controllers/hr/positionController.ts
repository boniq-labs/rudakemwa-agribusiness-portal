import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getPositions = async (req: AuthRequest, res: Response) => {
  try {
    const { department_id, search } = req.query;
    let query = `SELECT p.*, d.name as department_name FROM positions p LEFT JOIN departments d ON p.department_id = d.id WHERE p.deleted_at IS NULL`;
    const params: any[] = [];

    if (department_id) { query += ` AND p.department_id = ?`; params.push(department_id); }
    if (search) { query += ` AND (p.name LIKE ? OR p.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

    query += ` ORDER BY p.name`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createPosition = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    const name = b.name || b.title;
    const { department_id, description, requirements } = b;
    if (!name) return error(res, 'Position name is required', 400);
    const [result]: any = await pool.query(
      `INSERT INTO positions (name, department_id, description, requirements) VALUES (?,?,?,?)`,
      [name, department_id || null, description || null, requirements || null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Position', 'HR', `Created position ${name}`, { name, department_id, description, requirements }));
    return created(res, { id: result.insertId }, 'Position created');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePosition = async (req: AuthRequest, res: Response) => {
  try {
    const { name, department_id, description, requirements } = req.body;
    const [old]: any = await pool.query('SELECT * FROM positions WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (old.length === 0) return error(res, 'Position not found', 404);

    await pool.query(
      `UPDATE positions SET name=?, department_id=?, description=?, requirements=? WHERE id=?`,
      [name, department_id || null, description || null, requirements || null, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Position', 'HR', `Updated position ${name}`, req.body, old[0]));
    return success(res, null, 'Position updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deletePosition = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM positions WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (old.length === 0) return error(res, 'Position not found', 404);

    await pool.query('UPDATE positions SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Position', 'HR', `Deleted position ${old[0].name}`));
    return success(res, null, 'Position deleted');
  } catch (err: any) { return error(res, err.message); }
};
