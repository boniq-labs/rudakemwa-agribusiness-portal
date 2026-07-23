import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getPayrollRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { month, status } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (month) { where += ' AND p.month = ?'; params.push(month); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    const [rows]: any = await pool.query(
      `SELECT p.*, COUNT(pi.id) as total_employees, SUM(pi.net_salary) as total_payroll
       FROM payroll_records p
       LEFT JOIN payroll_items pi ON p.id = pi.payroll_id
       ${where} GROUP BY p.id ORDER BY p.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.body;
    const [employees]: any = await pool.query(
      `SELECT e.id as employee_id, e.user_id, sr.basic_salary, sr.allowances, sr.deductions, sr.net_salary
       FROM employees e
       JOIN salary_records sr ON e.id = sr.employee_id
       WHERE sr.month = ? AND e.deleted_at IS NULL`, [month]
    );
    if (employees.length === 0) return error(res, 'No salary records found for this month', 400);
    const total_gross = employees.reduce((sum: number, e: any) => sum + Number(e.basic_salary || 0) + Number(e.allowances || 0), 0);
    const total_deductions = employees.reduce((sum: number, e: any) => sum + Number(e.deductions || 0), 0);
    const total_net = employees.reduce((sum: number, e: any) => sum + Number(e.net_salary || 0), 0);
    const prNumber = `PR-${month}-${Date.now()}`;
    const [result]: any = await pool.query(
      'INSERT INTO payroll_records (payroll_number, month, total_gross, total_deductions, total_net, status) VALUES (?,?,?,?,?,?)', [prNumber, month, total_gross, total_deductions, total_net, 'pending']
    );
    for (const emp of employees) {
      await pool.query(
        `INSERT INTO payroll_items (payroll_id, employee_id, basic_salary, allowances, deductions, net_salary)
         VALUES (?,?,?,?,?,?)`,
        [result.insertId, emp.employee_id, emp.basic_salary, emp.allowances, emp.deductions, emp.net_salary]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Payroll', 'Accounting', `Payroll for ${month} created`, req.body));
    return created(res, { id: result.insertId, total_net }, 'Payroll created');
  } catch (err: any) { return error(res, err.message); }
};

export const processPayrollPayment = async (req: AuthRequest, res: Response) => {
  try {
    const [payroll]: any = await pool.query('SELECT * FROM payroll_records WHERE id = ?', [req.params.id]);
    if (payroll.length === 0) return error(res, 'Payroll not found', 404);
    await pool.query('UPDATE payroll_records SET status = ? WHERE id = ?', ['paid', req.params.id]);
    await pool.query('UPDATE payroll_items SET status = ? WHERE payroll_id = ?', ['paid', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Process Payroll', 'Accounting', `Payroll #${req.params.id} processed as paid`));
    return success(res, null, 'Payroll payment processed');
  } catch (err: any) { return error(res, err.message); }
};

export const getSalaryRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, month } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (employee_id) { where += ' AND sr.employee_id = ?'; params.push(employee_id); }
    if (month) { where += ' AND sr.month = ?'; params.push(month); }
    const [rows]: any = await pool.query(
      `SELECT sr.*, CONCAT(u.first_name, ' ', u.last_name) as employee_name
       FROM salary_records sr
       JOIN employees e ON sr.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ${where} ORDER BY sr.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const deletePayrollRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM payroll_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Payroll record not found', 404);
    await pool.query('DELETE FROM payroll_items WHERE payroll_id = ?', [req.params.id]);
    await pool.query('DELETE FROM payroll_records WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Payroll', 'Accounting', `Payroll #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Payroll record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const createSalaryRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, basic_salary, allowances, deductions, net_salary, month } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO salary_records (employee_id, basic_salary, allowances, deductions, net_salary, month) VALUES (?,?,?,?,?,?)`,
      [employee_id, basic_salary, allowances, deductions, net_salary, month]
    );
    await logAudit(req, createAuditEntry(req, 'Create Salary Record', 'Accounting', `Salary record created for employee #${employee_id}`, req.body));
    return created(res, { id: result.insertId }, 'Salary record created');
  } catch (err: any) { return error(res, err.message); }
};
