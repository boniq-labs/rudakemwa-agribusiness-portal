import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, error } from '../../utils/response';

export const getHRReports = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const [[{ total_employees }]]: any = await pool.query(
      "SELECT COUNT(*) as total_employees FROM employees WHERE deleted_at IS NULL AND status = 'active'"
    );
    const [[{ present_today }]]: any = await pool.query(
      "SELECT COUNT(*) as present_today FROM attendance WHERE date = CURDATE() AND status = 'present'"
    );
    const [[{ open_positions }]]: any = await pool.query(
      `SELECT COUNT(*) as open_positions FROM recruitment_jobs WHERE status = 'open'`
    );
    const [[{ active_trainings }]]: any = await pool.query(
      `SELECT COUNT(*) as active_trainings FROM trainings WHERE status = 'in_progress'`
    );
    const [[{ avg_rating }]]: any = await pool.query(
      `SELECT COALESCE(ROUND(AVG(rating), 1), 0) as avg_rating FROM performance_reviews`
    );

    const [recruitment]: any = await pool.query(
      `SELECT rj.title, (SELECT COUNT(*) FROM applicants a WHERE a.job_id = rj.id) as applicants_count, rj.status
       FROM recruitment_jobs rj ORDER BY rj.created_at DESC LIMIT 20`
    );
    const [training]: any = await pool.query(
      `SELECT t.title, (SELECT COUNT(*) FROM training_participants tp WHERE tp.training_id = t.id) as participants_count, t.start_date, t.status
       FROM trainings t ORDER BY t.start_date DESC LIMIT 20`
    );
    const [performance]: any = await pool.query(
      `SELECT CONCAT(u.first_name, ' ', u.last_name) as user_name, pr.rating, pr.review_date
       FROM performance_reviews pr
       JOIN employees e ON pr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ORDER BY pr.review_date DESC LIMIT 20`
    );

    const [attendance]: any = await pool.query(
      `SELECT a.date,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
              SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
              SUM(CASE WHEN a.late_minutes > 0 THEN 1 ELSE 0 END) as late
       FROM attendance a
       WHERE (a.date >= ? OR ? IS NULL) AND (a.date <= ? OR ? IS NULL)
       GROUP BY a.date ORDER BY a.date DESC LIMIT 31`,
      [start_date, start_date, end_date, end_date]
    );

    return success(res, {
      total_employees,
      present_today,
      open_positions,
      active_trainings,
      avg_rating,
      attendance,
      recruitment,
      training,
      performance,
    });
  } catch (err: any) { return error(res, err.message); }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let query = "SELECT * FROM tasks WHERE 1=1";
    const params: any[] = [];
    if (start_date) { query += " AND created_at >= ?"; params.push(start_date); }
    if (end_date) { query += " AND created_at <= ?"; params.push(end_date); }
    query += " ORDER BY due_date DESC LIMIT 50";
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
