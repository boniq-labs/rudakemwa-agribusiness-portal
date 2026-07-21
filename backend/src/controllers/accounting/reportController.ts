import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, error } from '../../utils/response';

export const getProfitLoss = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let where = '';
    const params: any[] = [];
    if (start_date && end_date) { where = 'WHERE date >= ? AND date <= ?'; params.push(start_date, end_date); }
    const [income]: any = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM income_records ${where}`, params);
    const [expense]: any = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM expense_records ${where}`, params);
    const totalIncome = Number(income[0].total);
    const totalExpense = Number(expense[0].total);
    return success(res, {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_profit: totalIncome - totalExpense,
      start_date,
      end_date,
    });
  } catch (err: any) { return error(res, err.message); }
};

export const getCashFlow = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let where = '';
    const params: any[] = [];
    if (start_date && end_date) { where = 'WHERE date >= ? AND date <= ?'; params.push(start_date, end_date); }
    const [inflows]: any = await pool.query(
      `SELECT DATE(date) as date, SUM(amount) as amount, source as category, 'inflow' as type
       FROM income_records ${where} GROUP BY DATE(date), source ORDER BY date`, params
    );
    const [outflows]: any = await pool.query(
      `SELECT DATE(e.date) as date, SUM(e.amount) as amount, ec.name as category, 'outflow' as type
       FROM expense_records e LEFT JOIN expense_categories ec ON e.category_id = ec.id
       ${where} GROUP BY DATE(e.date), ec.name ORDER BY date`, params
    );
    return success(res, { inflows, outflows });
  } catch (err: any) { return error(res, err.message); }
};

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.query;
    let format = '%Y-%m-%d';
    if (period === 'weekly') format = '%Y-%u';
    else if (period === 'monthly') format = '%Y-%m';
    else if (period === 'yearly') format = '%Y';
    const [income]: any = await pool.query(
      `SELECT DATE_FORMAT(date, '${format}') as period, SUM(amount) as total FROM income_records GROUP BY DATE_FORMAT(date, '${format}') ORDER BY period DESC LIMIT 12`
    );
    const [expense]: any = await pool.query(
      `SELECT DATE_FORMAT(date, '${format}') as period, SUM(amount) as total FROM expense_records GROUP BY DATE_FORMAT(date, '${format}') ORDER BY period DESC LIMIT 12`
    );
    const [pendingInvoices]: any = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total FROM invoices WHERE status IN ('pending','partial')"
    );
    const [unpaidPayroll]: any = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_net),0) as total FROM payroll_records WHERE status = 'pending'"
    );
    return success(res, { income, expense, pending_invoices: pendingInvoices[0], unpaid_payroll: unpaidPayroll[0] });
  } catch (err: any) { return error(res, err.message); }
};
