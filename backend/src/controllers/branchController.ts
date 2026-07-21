import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, created, error } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';

export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM branches WHERE deleted_at IS NULL');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, phone, email, currency } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO branches (name, code, address, phone, email, currency) VALUES (?,?,?,?,?,?)',
      [name, code, address, phone, email, currency || 'RWF']
    );
    await logAudit(req, createAuditEntry(req, 'Create', 'Branches', `Created branch ${name}`, req.body));
    return created(res, { id: result.insertId }, 'Branch created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, phone, email, currency, isActive } = req.body;
    await pool.query(
      'UPDATE branches SET name=?, code=?, address=?, phone=?, email=?, currency=?, is_active=? WHERE id=?',
      [name, code, address, phone, email, currency, isActive ?? true, req.params.id]
    );
    return success(res, null, 'Branch updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE branches SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Branch deleted');
  } catch (err: any) { return error(res, err.message); }
};
