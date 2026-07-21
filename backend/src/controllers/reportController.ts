import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';
import { createNotification } from './notificationController';

export const submitReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, report_date } = req.body;
    if (!content) return error(res, 'Report content is required');

    const [emp] = await pool.query('SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL', [userId]);
    if (!emp || !(emp as any[]).length) return error(res, 'Employee record not found');

    const empId = (emp as any[])[0].id;
    const date = report_date || new Date().toISOString().split('T')[0];

    const [existing]: any = await pool.query(
      'SELECT id FROM daily_reports WHERE employee_id = ? AND report_date = ? AND deleted_at IS NULL',
      [empId, date]
    );
    if (existing.length > 0) {
      await pool.query(
        'UPDATE daily_reports SET title = ?, content = ?, status = "submitted", submitted_at = NOW() WHERE id = ?',
        [title || '', content, existing[0].id]
      );
      try { await createNotification(userId, 'info', 'New Report', `Report updated: ${title || 'Daily report'}`); } catch {}
      return success(res, { id: existing[0].id, message: 'Report updated and submitted' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO daily_reports (employee_id, title, content, report_date, status) VALUES (?,?,?,?,"submitted")',
      [empId, title || '', content, date]
    );
    try { await createNotification(userId, 'info', 'New Report', `Report submitted: ${title || 'Daily report'}`); } catch {}
    return success(res, { id: result.insertId, message: 'Report submitted successfully' });
  } catch (err: any) { return error(res, err.message); }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emp] = await pool.query('SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL', [userId]);
    if (!emp || !(emp as any[]).length) return success(res, []);
    const empId = (emp as any[])[0].id;
    const [rows] = await pool.query(
      'SELECT * FROM daily_reports WHERE employee_id = ? AND deleted_at IS NULL ORDER BY report_date DESC LIMIT 50',
      [empId]
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getDepartmentReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { status, date_from, date_to } = req.query;

    let deptId: number | null = null;

    if (role === 'owner' || role === 'admin') {
      // Super admin sees all
    } else {
      const [user]: any = await pool.query('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (user.length > 0) deptId = user[0].department_id;
    }

    let sql = `SELECT dr.*, u.first_name, u.last_name, u.username, d.name as department_name
               FROM daily_reports dr
               JOIN employees e ON dr.employee_id = e.id
               JOIN users u ON e.user_id = u.id
               LEFT JOIN departments d ON u.department_id = d.id
               WHERE dr.deleted_at IS NULL`;
    const params: any[] = [];

    if (deptId) { sql += ' AND u.department_id = ?'; params.push(deptId); }
    if (status) { sql += ' AND dr.status = ?'; params.push(status); }
    if (date_from) { sql += ' AND dr.report_date >= ?'; params.push(date_from); }
    if (date_to) { sql += ' AND dr.report_date <= ?'; params.push(date_to); }

    sql += ' ORDER BY dr.submitted_at DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const approveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;

    const [report]: any = await pool.query(
      'SELECT id, employee_id FROM daily_reports WHERE id = ? AND deleted_at IS NULL', [id]
    );
    if (!report.length) return error(res, 'Report not found');

    await pool.query(
      'UPDATE daily_reports SET status = "approved", manager_comment = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [comment || null, userId, id]
    );
    return success(res, { message: 'Report approved' });
  } catch (err: any) { return error(res, err.message); }
};

export const rejectReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment) return error(res, 'Rejection comment is required');
    const userId = req.user!.id;

    const [report]: any = await pool.query(
      'SELECT id, employee_id FROM daily_reports WHERE id = ? AND deleted_at IS NULL', [id]
    );
    if (!report.length) return error(res, 'Report not found');

    await pool.query(
      'UPDATE daily_reports SET status = "rejected", manager_comment = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [comment, userId, id]
    );
    return success(res, { message: 'Report rejected' });
  } catch (err: any) { return error(res, err.message); }
};
