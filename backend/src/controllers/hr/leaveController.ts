import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getLeaveTypes = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM leave_types WHERE deleted_at IS NULL ORDER BY name');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const { name, days_allowed, requires_approval } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO leave_types (name, days_allowed, requires_approval) VALUES (?,?,?)`,
      [name, days_allowed, requires_approval ?? true]
    );
    await logAudit(req, createAuditEntry(req, 'Create Leave Type', 'HR', `Created leave type ${name}`, req.body));
    return created(res, { id: result.insertId }, 'Leave type created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const { name, days_allowed, requires_approval } = req.body;
    const [old]: any = await pool.query('SELECT * FROM leave_types WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Leave type not found', 404);

    await pool.query(
      `UPDATE leave_types SET name=?, days_allowed=?, requires_approval=? WHERE id=?`,
      [name, days_allowed, requires_approval, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Leave Type', 'HR', `Updated leave type ${name}`, req.body, old[0]));
    return success(res, null, 'Leave type updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, date_from, date_to, employee_id } = req.query;
    let query = `SELECT lr.*, lt.name as leave_type_name, lt.days_allowed,
                 CONCAT(ue.first_name, ' ', ue.last_name) as employee_name,
                 CONCAT(ua.first_name, ' ', ua.last_name) as approved_by_name
                 FROM leave_requests lr
                 JOIN leave_types lt ON lr.leave_type_id = lt.id
                 JOIN employees e ON lr.employee_id = e.id
                 JOIN users ue ON e.user_id = ue.id
                 LEFT JOIN users ua ON lr.approved_by = ua.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (status) { query += ` AND lr.status = ?`; params.push(status); }
    if (date_from) { query += ` AND lr.start_date >= ?`; params.push(date_from); }
    if (date_to) { query += ` AND lr.end_date <= ?`; params.push(date_to); }
    if (employee_id) { query += ` AND lr.employee_id = ?`; params.push(employee_id); }

    query += ` ORDER BY lr.created_at DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status)
       VALUES (?,?,?,?,?,'pending')`,
      [employee_id, leave_type_id, start_date || null, end_date || null, reason || null]
    );
    await logAudit(req, createAuditEntry(req, 'Create Leave Request', 'HR', `Leave request created for employee ${employee_id}`, req.body));
    return created(res, { id: result.insertId }, 'Leave request created');
  } catch (err: any) { return error(res, err.message); }
};

export const approveLeave = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Leave request not found', 404);
    if (old[0].status !== 'pending') return error(res, 'Leave request is not pending', 400);

    await pool.query('UPDATE leave_requests SET status=?, approved_by=?, approved_at=NOW() WHERE id=?',
      ['approved', req.user?.id, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Approve Leave', 'HR', `Approved leave request ${req.params.id}`));
    return success(res, null, 'Leave approved');
  } catch (err: any) { return error(res, err.message); }
};

export const rejectLeave = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Leave request not found', 404);
    if (old[0].status !== 'pending') return error(res, 'Leave request is not pending', 400);

    await pool.query('UPDATE leave_requests SET status=?, approved_by=? WHERE id=?', ['rejected', req.user?.id, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Reject Leave', 'HR', `Rejected leave request ${req.params.id}`));
    return success(res, null, 'Leave rejected');
  } catch (err: any) { return error(res, err.message); }
};

export const cancelLeave = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Leave request not found', 404);
    if (old[0].status === 'cancelled') return error(res, 'Leave request already cancelled', 400);

    await pool.query('UPDATE leave_requests SET status=? WHERE id=?', ['cancelled', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Cancel Leave', 'HR', `Cancelled leave request ${req.params.id}`));
    return success(res, null, 'Leave cancelled');
  } catch (err: any) { return error(res, err.message); }
};
