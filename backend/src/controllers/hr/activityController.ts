import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const addActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { task_description, issue_description } = req.body;
    const userId = req.user!.id;

    const [emps]: any = await pool.query(
      'SELECT id FROM employees WHERE user_id = ? AND status = ? LIMIT 1',
      [userId, 'active']
    );
    if (emps.length === 0) return error(res, 'Employee record not found', 404);

    const employeeId = emps[0].id;

    const [result]: any = await pool.query(
      'INSERT INTO employee_activities (employee_id, date, task_description, issue_description) VALUES (?, CURDATE(), ?, ?)',
      [employeeId, task_description || null, issue_description || null]
    );

    await logAudit(req, createAuditEntry(req, 'Add Activity', 'HR', `Employee ${employeeId} added daily activity`));
    return created(res, { id: result.insertId }, 'Daily activity saved');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const getMyActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emps]: any = await pool.query(
      'SELECT id FROM employees WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (emps.length === 0) return success(res, []);

    const employeeId = emps[0].id;
    const [rows]: any = await pool.query(
      'SELECT * FROM employee_activities WHERE employee_id = ? ORDER BY created_at DESC',
      [employeeId]
    );
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const getAllActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, department_id, date_from, date_to } = req.query;
    let query = `
      SELECT a.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name,
             d.name as department_name
      FROM employee_activities a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1`;
    const params: any[] = [];

    if (employee_id) { query += ' AND a.employee_id = ?'; params.push(employee_id); }
    if (department_id) { query += ' AND u.department_id = ?'; params.push(department_id); }
    if (date_from) { query += ' AND a.date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND a.date <= ?'; params.push(date_to); }

    query += ' ORDER BY a.created_at DESC';
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};
