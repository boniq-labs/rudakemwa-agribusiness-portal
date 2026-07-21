import pool from '../../config/database';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
export const getAttendance = async (req, res) => {
    try {
        const { employee_id, date_from, date_to } = req.query;
        let query = `SELECT a.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
                 FROM attendance a JOIN employees e ON a.employee_id = e.id
                 JOIN users u ON e.user_id = u.id WHERE 1=1`;
        const params = [];
        if (employee_id) {
            query += ` AND a.employee_id = ?`;
            params.push(employee_id);
        }
        if (date_from) {
            query += ` AND a.date >= ?`;
            params.push(date_from);
        }
        if (date_to) {
            query += ` AND a.date <= ?`;
            params.push(date_to);
        }
        query += ` ORDER BY a.date DESC, a.check_in DESC`;
        const [rows] = await pool.query(query, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const checkIn = async (req, res) => {
    try {
        const { employee_id, notes } = req.body;
        const [existing] = await pool.query('SELECT id FROM attendance WHERE employee_id = ? AND date = CURDATE() AND check_out IS NULL', [employee_id]);
        if (existing.length > 0)
            return error(res, 'Already checked in today', 400);
        const [result] = await pool.query(`INSERT INTO attendance (employee_id, date, check_in, notes) VALUES (?, CURDATE(), NOW(), ?)`, [employee_id, notes || null]);
        await logAudit(req, createAuditEntry(req, 'Check In', 'HR', `Employee ${employee_id} checked in`));
        return created(res, { id: result.insertId }, 'Check in recorded');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const checkOut = async (req, res) => {
    try {
        const [record] = await pool.query('SELECT * FROM attendance WHERE id = ? AND check_out IS NULL', [req.params.id]);
        if (record.length === 0)
            return error(res, 'Attendance record not found or already checked out', 404);
        const checkIn = new Date(record[0].check_in);
        const checkOut = new Date();
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        let lateMinutes = 0;
        let overtime = 0;
        const scheduledStart = new Date(checkIn);
        scheduledStart.setHours(8, 0, 0, 0);
        if (checkIn > scheduledStart)
            lateMinutes = Math.round((checkIn.getTime() - scheduledStart.getTime()) / 60000);
        const scheduledEnd = new Date(checkOut);
        scheduledEnd.setHours(17, 0, 0, 0);
        if (checkOut > scheduledEnd)
            overtime = Math.round((checkOut.getTime() - scheduledEnd.getTime()) / 60000);
        await pool.query(`UPDATE attendance SET check_out=NOW(), total_hours=?, late_minutes=?, overtime=? WHERE id=?`, [Math.round(diffHours * 100) / 100, lateMinutes, overtime, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Check Out', 'HR', `Employee ${record[0].employee_id} checked out`));
        return success(res, null, 'Check out recorded');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getAttendanceReport = async (req, res) => {
    try {
        const { date_from, date_to, employee_id, export: exportFormat } = req.query;
        let query = `SELECT a.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
                 FROM attendance a JOIN employees e ON a.employee_id = e.id
                 JOIN users u ON e.user_id = u.id WHERE 1=1`;
        const params = [];
        if (date_from) {
            query += ` AND a.date >= ?`;
            params.push(date_from);
        }
        if (date_to) {
            query += ` AND a.date <= ?`;
            params.push(date_to);
        }
        if (employee_id) {
            query += ` AND a.employee_id = ?`;
            params.push(employee_id);
        }
        query += ` ORDER BY a.date DESC, a.employee_id`;
        const [rows] = await pool.query(query, params);
        if (exportFormat === 'csv') {
            const header = 'ID,Employee,Date,Check In,Check Out,Hours,Late Minutes,Overtime,Notes\n';
            const csv = rows.map((r) => `${r.id},${r.employee_name},${r.date},${r.check_in},${r.check_out},${r.total_hours},${r.late_minutes},${r.overtime},"${r.notes || ''}"`).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            return res.send(header + csv);
        }
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=attendanceController.js.map