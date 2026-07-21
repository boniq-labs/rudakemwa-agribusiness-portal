import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getContracts = async (req: AuthRequest, res: Response) => {
  try {
    const { employee_id, status } = req.query;
    let query = `SELECT c.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
                 FROM contracts c JOIN employees e ON c.employee_id = e.id
                 JOIN users u ON e.user_id = u.id WHERE 1=1`;
    const params: any[] = [];

    if (employee_id) { query += ` AND c.employee_id = ?`; params.push(employee_id); }
    if (status) { query += ` AND c.status = ?`; params.push(status); }

    query += ` ORDER BY c.created_at DESC`;
    const [rows]: any = await pool.query(query, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createContract = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    // Accept user_id (frontend) or employee_id (backend)
    let employeeId = b.employee_id || b.user_id;
    if (!employeeId) return error(res, 'Employee ID is required', 400);
    // If user_id was provided, look up the employee record
    if (b.user_id && !b.employee_id) {
      const [emp]: any = await pool.query('SELECT id FROM employees WHERE user_id = ?', [b.user_id]);
      if (emp.length > 0) employeeId = emp[0].id;
    }
    const contract_type = b.type || b.contract_type;
    const start_date = b.start_date;
    const end_date = b.end_date || null;
    const salary = b.salary ? Number(b.salary) : 0;
    const document_url = b.document_url || b.terms || null;
    if (!contract_type) return error(res, 'Contract type is required', 400);
    if (!start_date) return error(res, 'Start date is required', 400);
    const [result]: any = await pool.query(
      `INSERT INTO contracts (employee_id, contract_type, start_date, end_date, salary, document_url, status)
       VALUES (?,?,?,?,?,?,'active')`,
      [employeeId, contract_type, start_date, end_date, salary, document_url]
    );
    await logAudit(req, createAuditEntry(req, 'Create Contract', 'HR', `Created contract for employee ${employeeId}`, req.body));
    return created(res, { id: result.insertId }, 'Contract created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateContract = async (req: AuthRequest, res: Response) => {
  try {
    const { type, start_date, end_date, salary, terms, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Contract not found', 404);

    await pool.query(
      `UPDATE contracts SET type=?, start_date=?, end_date=?, salary=?, terms=?, status=? WHERE id=?`,
      [type, start_date, end_date || null, salary, terms || null, status, req.params.id]
    );
    await logAudit(req, createAuditEntry(req, 'Update Contract', 'HR', `Updated contract ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Contract updated');
  } catch (err: any) { return error(res, err.message); }
};

export const terminateContract = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Contract not found', 404);
    if (old[0].status === 'terminated') return error(res, 'Contract already terminated', 400);

    await pool.query('UPDATE contracts SET status=?, end_date=CURDATE() WHERE id=?', ['terminated', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Terminate Contract', 'HR', `Terminated contract ${req.params.id}`));
    return success(res, null, 'Contract terminated');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpiringContracts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT c.*, e.employee_code, CONCAT(u.first_name, ' ', u.last_name) as employee_name
       FROM contracts c JOIN employees e ON c.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE c.status = 'active' AND c.end_date IS NOT NULL
       AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY c.end_date`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
