import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

export const getShiftEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.photo, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL AND u.is_active = 1
       AND u.department_id = (SELECT id FROM departments WHERE name = 'Animal Production' LIMIT 1)
       ORDER BY u.first_name`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getShifts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT es.*, u.first_name, u.last_name, u.photo, d.name as department_name
       FROM employee_shifts es
       JOIN users u ON es.employee_id = u.id
       JOIN departments d ON es.department_id = d.id
       ORDER BY es.created_at DESC`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getMyShift = async (req: AuthRequest, res: Response) => {
  try {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[new Date().getDay()];
    const [rows]: any = await pool.query(
      `SELECT es.*, d.name as department_name
       FROM employee_shifts es
       JOIN departments d ON es.department_id = d.id
       WHERE es.employee_id = ?
       ORDER BY es.created_at DESC LIMIT 1`,
      [req.user!.id]
    );
    if (rows.length === 0) return success(res, null, 'No shift assigned');
    const shift = rows[0];
    let workingDays: string[] = [];
    try { workingDays = typeof shift.working_days === 'string' ? JSON.parse(shift.working_days) : shift.working_days || []; } catch { workingDays = []; }
    const hasToday = workingDays.some((d: string) => d.toLowerCase() === today.toLowerCase());
    return success(res, { ...shift, today: hasToday });
  } catch (err: any) { return error(res, err.message); }
};

export const createShift = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, shift_name, start_time, end_time, working_days } = req.body;
    const [dept]: any = await pool.query("SELECT id FROM departments WHERE name = 'Animal Production' LIMIT 1");
    if (dept.length === 0) return error(res, 'Animal Production department not found', 404);
    const department_id = dept[0].id;
    const [result]: any = await pool.query(
      `INSERT INTO employee_shifts (employee_id, department_id, shift_name, start_time, end_time, working_days, assigned_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, department_id, shift_name, start_time, end_time, JSON.stringify(working_days), req.user!.id]
    );
    return success(res, { id: result.insertId }, 'Shift assigned successfully');
  } catch (err: any) { return error(res, err.message); }
};

export const updateShift = async (req: AuthRequest, res: Response) => {
  try {
    const { shift_name, start_time, end_time, working_days } = req.body;
    const fields: string[] = [];
    const params: any[] = [];
    if (shift_name !== undefined) { fields.push('shift_name = ?'); params.push(shift_name); }
    if (start_time !== undefined) { fields.push('start_time = ?'); params.push(start_time); }
    if (end_time !== undefined) { fields.push('end_time = ?'); params.push(end_time); }
    if (working_days !== undefined) { fields.push('working_days = ?'); params.push(JSON.stringify(working_days)); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    params.push(req.params.id);
    await pool.query(`UPDATE employee_shifts SET ${fields.join(', ')} WHERE id = ?`, params);
    return success(res, null, 'Shift updated successfully');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteShift = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM employee_shifts WHERE id = ?', [req.params.id]);
    return success(res, null, 'Shift deleted successfully');
  } catch (err: any) { return error(res, err.message); }
};
