import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let query = `SELECT * FROM trainings WHERE 1=1`;
    const params: any[] = [];

    if (status) { query += ` AND status = ?`; params.push(status); }

    query += ` ORDER BY start_date DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, trainer, start_date, end_date, status } = req.body;
    // Default start_date to today if not provided
    const start = start_date || new Date().toISOString().split('T')[0];
    const [result]: any = await pool.query(
      `INSERT INTO trainings (title, description, trainer, start_date, end_date, status)
       VALUES (?,?,?,?,?,?)`,
      [title, description || null, trainer || null, start, end_date || null, status || 'planned']
    );
    await logAudit(req, createAuditEntry(req, 'Create Training', 'HR', `Created training ${title}`, req.body));
    return created(res, { id: result.insertId }, 'Training created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, trainer, start_date, end_date, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM trainings WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Training not found', 404);

    await pool.query(
      `UPDATE trainings SET title=?, description=?, trainer=?, start_date=?, end_date=?, status=? WHERE id=?`,
      [title, description || null, trainer || null, start_date || null, end_date || null, status, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Training', 'HR', `Updated training ${title}`, req.body, old[0]));
    return success(res, null, 'Training updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getTrainingParticipants = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT tp.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
       FROM training_participants tp
       JOIN employees e ON tp.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE tp.training_id = ?
       ORDER BY tp.enrolled_at`,
      [req.params.training_id]
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const enrollParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const trainingId = Number(req.body.training_id || req.params.trainingId || req.params.id);
    let employeeId = req.body.employee_id;
    // Accept userId from frontend and look up employee record
    if (!employeeId && req.body.userId) {
      const [emp]: any = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.body.userId]);
      if (emp.length > 0) employeeId = emp[0].id;
    }
    if (!trainingId) return error(res, 'Training ID is required', 400);
    if (!employeeId) return error(res, 'Employee ID is required', 400);

    const [existing]: any = await pool.query(
      'SELECT id FROM training_participants WHERE training_id = ? AND employee_id = ?',
      [trainingId, employeeId]
    );
    if (existing.length > 0) return error(res, 'Employee already enrolled', 400);

    const [result]: any = await pool.query(
      `INSERT INTO training_participants (training_id, employee_id, status) VALUES (?,?,'enrolled')`,
      [trainingId, employeeId]
    );
    await logAudit(req, createAuditEntry(req, 'Enroll Participant', 'HR', `Enrolled employee ${employeeId} in training ${trainingId}`));
    return created(res, { id: result.insertId }, 'Participant enrolled');
  } catch (err: any) { return error(res, err.message); }
};

export const updateParticipantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, score, certificate_url } = req.body;
    const [old]: any = await pool.query('SELECT * FROM training_participants WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Participant not found', 404);

    await pool.query(
      `UPDATE training_participants SET status=?, score=?, certificate_url=?, completed_at=? WHERE id=?`,
      [status, score || null, certificate_url || null, status === 'completed' ? new Date() : null, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Participant Status', 'HR', `Updated participant ${req.params.id} status to ${status}`));
    return success(res, null, 'Participant status updated');
  } catch (err: any) { return error(res, err.message); }
};
