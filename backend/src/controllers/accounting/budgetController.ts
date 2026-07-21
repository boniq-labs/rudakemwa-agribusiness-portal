import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const { department_id, fiscal_year } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (department_id) { where += ' AND b.department_id = ?'; params.push(department_id); }
    if (fiscal_year) { where += ' AND b.fiscal_year = ?'; params.push(fiscal_year); }
    const [rows]: any = await pool.query(
      `SELECT b.*, d.name as department_name
       FROM budgets b LEFT JOIN departments d ON b.department_id = d.id
       ${where} ORDER BY b.created_at DESC`, params
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { name, department_id, fiscal_year, total_amount, items } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO budgets (name, department_id, fiscal_year, total_amount) VALUES (?,?,?,?)`,
      [name, department_id, fiscal_year, total_amount]
    );
    for (const item of items || []) {
      const catId = item.category_id || item.expense_category_id;
      await pool.query(
        `INSERT INTO budget_items (budget_id, category_id, planned_amount) VALUES (?,?,?)`,
        [result.insertId, catId, item.planned_amount]
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Budget', 'Accounting', `Budget ${name} created`, req.body));
    return created(res, { id: result.insertId }, 'Budget created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateBudgetStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM budgets WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Budget not found', 404);
    await pool.query('UPDATE budgets SET status = ? WHERE id = ?', [status, req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Update Budget Status', 'Accounting', `Budget #${req.params.id} status changed to ${status}`, req.body, old[0]));
    return success(res, null, 'Budget status updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getBudgetVsActual = async (req: AuthRequest, res: Response) => {
  try {
    const [budget]: any = await pool.query(
      `SELECT b.*, d.name as department_name
       FROM budgets b LEFT JOIN departments d ON b.department_id = d.id WHERE b.id = ?`, [req.params.id]
    );
    if (budget.length === 0) return error(res, 'Budget not found', 404);
    const [items]: any = await pool.query(
      `SELECT bi.*, ec.name as category_name,
        (SELECT COALESCE(SUM(amount),0) FROM expense_records WHERE category_id = bi.category_id AND YEAR(date) = ?) as actual_amount
       FROM budget_items bi
       LEFT JOIN expense_categories ec ON bi.category_id = ec.id
       WHERE bi.budget_id = ?`, [budget[0].fiscal_year, req.params.id]
    );
    return success(res, { budget: budget[0], items });
  } catch (err: any) { return error(res, err.message); }
};
