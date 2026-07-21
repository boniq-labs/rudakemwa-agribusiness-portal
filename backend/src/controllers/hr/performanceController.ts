import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getPerformanceReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, reviewer_id } = req.query;
    let query = `SELECT pr.*, CONCAT(ue.first_name, ' ', ue.last_name) as employee_name,
                 CONCAT(ur.first_name, ' ', ur.last_name) as reviewer_name
                 FROM performance_reviews pr
                 LEFT JOIN employees e ON pr.employee_id = e.id
                 LEFT JOIN users ue ON e.user_id = ue.id
                 LEFT JOIN users ur ON pr.reviewer_id = ur.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (employee_id) { query += ` AND pr.employee_id = ?`; params.push(employee_id); }
    if (req.query.reviewer_id) { query += ` AND pr.reviewer_id = ?`; params.push(req.query.reviewer_id); }

    query += ` ORDER BY pr.created_at DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createPerformanceReview = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    // Accept user_id (frontend) or employee_id (backend)
    let employeeId = b.employee_id || b.user_id;
    if (!employeeId) return error(res, 'Employee ID is required', 400);
    if (b.user_id && !b.employee_id) {
      const [emp]: any = await pool.query('SELECT id FROM employees WHERE user_id = ?', [b.user_id]);
      if (emp.length > 0) employeeId = emp[0].id;
    }
    // Accept reviewer_name (frontend) or reviewer_id (backend)
    // reviewer_id is a FK to users table, so use current user as fallback
    let reviewerId = b.reviewer_id || null;
    if (!reviewerId) {
      reviewerId = req.user?.id || null;
      // Try to find a user matching the reviewer name
      if (b.reviewer_name && !reviewerId) {
        const [userRow]: any = await pool.query('SELECT id FROM users WHERE CONCAT(first_name, " ", last_name) = ? OR first_name = ? LIMIT 1', [b.reviewer_name, b.reviewer_name]);
        if (userRow.length > 0) reviewerId = userRow[0].id;
      }
    }
    if (!reviewerId) return error(res, 'Reviewer information is required', 400);
    const reviewDate = b.review_date;
    // Accept score (0-100 frontend) or rating (1-5 backend)
    const rating = b.rating || (b.score ? Math.round(b.score / 20) : 3);
    // Append reviewer_name to notes for reference if not a user ID
    let notes = b.notes || b.comments || '';
    if (b.reviewer_name && !b.reviewer_id) {
      notes = (notes ? notes + '\n' : '') + 'Reviewed by: ' + b.reviewer_name;
    }
    const goals = b.goals || null;
    if (!reviewDate) return error(res, 'Review date is required', 400);
    const [result]: any = await pool.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, score, rating, comments, goals)
       VALUES (?,?,?,?,?,?)`,
      [employeeId, reviewerId, b.score ? Number(b.score) : null, rating, notes || null, goals ? JSON.stringify(goals) : null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Performance Review', 'HR', `Review created for employee ${employeeId}`, req.body));
    return created(res, { id: result.insertId }, 'Performance review created');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePerformanceReview = async (req: AuthRequest, res: Response) => {
  try {
    const { score, rating, comments, goals } = req.body;
    const [old]: any = await pool.query('SELECT * FROM performance_reviews WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Performance review not found', 404);

    await pool.query(
      `UPDATE performance_reviews SET score=?, rating=?, comments=?, goals=? WHERE id=?`,
      [score, rating, comments || null, goals ? JSON.stringify(goals) : null, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Performance Review', 'HR', `Updated review ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Performance review updated');
  } catch (err: any) { return error(res, err.message); }
};
