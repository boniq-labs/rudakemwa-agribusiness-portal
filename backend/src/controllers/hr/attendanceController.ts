import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, date_from, date_to } = req.query;
    let query = `SELECT a.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
                 FROM attendance a JOIN employees e ON a.employee_id = e.id
                 JOIN users u ON e.user_id = u.id WHERE 1=1`;
    const params: any[] = [];

    if (employee_id) { query += ` AND a.employee_id = ?`; params.push(employee_id); }
    if (date_from) { query += ` AND a.date >= ?`; params.push(date_from); }
    if (date_to) { query += ` AND a.date <= ?`; params.push(date_to); }

    query += ` ORDER BY a.date DESC, a.check_in DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emps]: any = await pool.query(
      'SELECT id FROM employees WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (emps.length === 0) return success(res, null);

    const employeeId = emps[0].id;
    const [rows]: any = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = CURDATE() LIMIT 1',
      [employeeId]
    );
    return success(res, rows.length > 0 ? rows[0] : null);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const employeeCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emps]: any = await pool.query(
      'SELECT id FROM employees WHERE user_id = ? AND status = ? LIMIT 1',
      [userId, 'active']
    );
    if (emps.length === 0) return error(res, 'Employee record not found or inactive', 404);

    const employeeId = emps[0].id;
    const [existing]: any = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = CURDATE() AND check_out IS NULL',
      [employeeId]
    );
    if (existing.length > 0) return error(res, 'Already checked in today', 400);

    const [existingComplete]: any = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = CURDATE() AND check_out IS NOT NULL',
      [employeeId]
    );
    if (existingComplete.length > 0) return error(res, 'Already completed today', 400);

    const [result]: any = await pool.query(
      'INSERT INTO attendance (employee_id, user_id, date, check_in) VALUES (?, ?, CURDATE(), NOW())',
      [employeeId, userId]
    );
    await logAudit(req, createAuditEntry(req, 'Check In', 'HR', `Employee ${employeeId} checked in`));
    return created(res, { id: result.insertId }, 'Check in recorded');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const employeeCheckOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emps]: any = await pool.query(
      'SELECT id FROM employees WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (emps.length === 0) return error(res, 'Employee record not found', 404);

    const employeeId = emps[0].id;
    const [records]: any = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = CURDATE() AND check_out IS NULL LIMIT 1',
      [employeeId]
    );
    if (records.length === 0) return error(res, 'No active check-in found for today', 404);

    const record = records[0];
    const checkInTime = new Date(record.check_in);
    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let lateMinutes = 0;
    let overtime = 0;
    const scheduledStart = new Date(checkInTime);
    scheduledStart.setHours(8, 0, 0, 0);
    if (checkInTime > scheduledStart) lateMinutes = Math.round((checkInTime.getTime() - scheduledStart.getTime()) / 60000);

    const scheduledEnd = new Date(checkOutTime);
    scheduledEnd.setHours(17, 0, 0, 0);
    if (checkOutTime > scheduledEnd) overtime = Math.round((checkOutTime.getTime() - scheduledEnd.getTime()) / 60000);

    await pool.query(
      'UPDATE attendance SET check_out=NOW(), total_hours=?, late_minutes=?, overtime=?, status=? WHERE id=?',
      [Math.round(diffHours * 100) / 100, lateMinutes, overtime, 'present', record.id]
    );
    await logAudit(req, createAuditEntry(req, 'Check Out', 'HR', `Employee ${employeeId} checked out`));
    return success(res, { id: record.id, check_out: checkOutTime }, 'Check out recorded');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, notes } = req.body;
    const [existing]: any = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = CURDATE() AND check_out IS NULL',
      [employee_id]
    );
    if (existing.length > 0) return error(res, 'Already checked in today', 400);

    const [empRow]: any = await pool.query('SELECT user_id FROM employees WHERE id = ?', [employee_id]);
    const uid = empRow.length > 0 ? empRow[0].user_id : null;
    const [result]: any = await pool.query(
      `INSERT INTO attendance (employee_id, user_id, date, check_in, notes) VALUES (?, ?, CURDATE(), NOW(), ?)`,
      [employee_id, uid, notes || null]
    );
    await logAudit(req, createAuditEntry(req, 'Check In', 'HR', `Employee ${employee_id} checked in`));
    return created(res, { id: result.insertId }, 'Check in recorded');
  } catch (err: any) { return error(res, err.message); }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
  try {
    const [record]: any = await pool.query(
      'SELECT * FROM attendance WHERE id = ? AND check_out IS NULL', [req.params.id]
    );
    if (record.length === 0) return error(res, 'Attendance record not found or already checked out', 404);

    const checkIn = new Date(record[0].check_in);
    const checkOut = new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let lateMinutes = 0;
    let overtime = 0;
    const scheduledStart = new Date(checkIn);
    scheduledStart.setHours(8, 0, 0, 0);
    if (checkIn > scheduledStart) lateMinutes = Math.round((checkIn.getTime() - scheduledStart.getTime()) / 60000);

    const scheduledEnd = new Date(checkOut);
    scheduledEnd.setHours(17, 0, 0, 0);
    if (checkOut > scheduledEnd) overtime = Math.round((checkOut.getTime() - scheduledEnd.getTime()) / 60000);

    await pool.query(
      `UPDATE attendance SET check_out=NOW(), total_hours=?, late_minutes=?, overtime=? WHERE id=?`,
      [Math.round(diffHours * 100) / 100, lateMinutes, overtime, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Check Out', 'HR', `Employee ${record[0].employee_id} checked out`));
    return success(res, null, 'Check out recorded');
  } catch (err: any) { return error(res, err.message); }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { date_from, date_to, employee_id, export: exportFormat } = req.query;
    let query = `SELECT a.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
                 FROM attendance a JOIN employees e ON a.employee_id = e.id
                 JOIN users u ON e.user_id = u.id WHERE 1=1`;
    const params: any[] = [];

    if (date_from) { query += ` AND a.date >= ?`; params.push(date_from); }
    if (date_to) { query += ` AND a.date <= ?`; params.push(date_to); }
    if (employee_id) { query += ` AND a.employee_id = ?`; params.push(employee_id); }

    query += ` ORDER BY a.date DESC, a.employee_id`;
    const [rows]: any = await pool.query(query, params);

    if (exportFormat === 'csv') {
      const header = 'ID,Employee,Date,Check In,Check Out,Hours,Late Minutes,Overtime,Notes\n';
      const csv = rows.map((r: any) =>
        `${r.id},${r.employee_name},${r.date},${r.check_in},${r.check_out},${r.total_hours},${r.late_minutes},${r.overtime},"${r.notes || ''}"`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(header + csv);
    }

    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
