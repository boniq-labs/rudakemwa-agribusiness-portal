import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { type, search, status } = req.query;
    let where = 'WHERE c.deleted_at IS NULL';
    const params: any[] = [];
    if (type) { where += ' AND c.customer_type = ?'; params.push(type); }
    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (search) { where += ' AND (CONCAT(c.first_name,\' \',c.last_name) LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    const [rows]: any = await pool.query(`SELECT c.*, CONCAT(c.first_name, ' ', c.last_name) as name FROM customers c ${where} ORDER BY c.created_at DESC`, params);
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body;
    const name = b.name || '';
    const nameParts = name.split(' ');
    const first_name = b.first_name || nameParts[0] || '';
    const last_name = b.last_name || nameParts.slice(1).join(' ') || '';
    const customer_type = b.customer_type || b.type || 'individual';
    const customer_code = b.customer_code || `CUST-${Date.now()}`;
    const { company_name, phone, email, address, credit_limit, payment_terms } = b;
    const initial_payment = Math.max(0, Number(b.initial_payment) || 0);
    const [result]: any = await pool.query(
      `INSERT INTO customers (first_name, last_name, company_name, phone, email, address, customer_type, credit_limit, payment_terms, customer_code, balance)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [first_name, last_name, company_name || null, phone || null, email || null, address || null, customer_type, credit_limit || null, payment_terms || null, customer_code, initial_payment]
    );
    if (initial_payment > 0) {
      await pool.query(
        `INSERT INTO customer_payments (customer_id, amount, payment_method) VALUES (?, ?, ?)`,
        [result.insertId, initial_payment, 'initial']
      );
    }
    await logAudit(req, createAuditEntry(req, 'Create Customer', 'Sales', `Customer ${first_name} ${last_name} created`, req.body));
    return created(res, { id: result.insertId }, 'Customer created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Customer not found', 404);
    const b = req.body;
    const name = b.name || '';
    const nameParts = name.split(' ');
    const first_name = b.first_name || nameParts[0] || old[0].first_name;
    const last_name = b.last_name || nameParts.slice(1).join(' ') || old[0].last_name;
    const customer_type = b.customer_type || b.type || old[0].customer_type;
    const { company_name, phone, email, address, credit_limit, payment_terms, status } = b;
    const balance = b.balance !== undefined ? Math.max(0, Number(b.balance) || 0) : old[0].balance;
    await pool.query(
      `UPDATE customers SET first_name=?, last_name=?, company_name=?, phone=?, email=?, address=?, customer_type=?, credit_limit=?, payment_terms=?, status=?, balance=? WHERE id=?`,
      [first_name, last_name, company_name || null, phone || null, email || null, address || null, customer_type, credit_limit || null, payment_terms || null, status || old[0].status, balance, req.params.id]
    );
    if (b.balance !== undefined && balance > old[0].balance) {
      const diff = balance - old[0].balance;
      await pool.query(
        `INSERT INTO customer_payments (customer_id, invoice_id, amount, payment_method) VALUES (?, NULL, ?, ?)`,
        [req.params.id, diff, 'payment']
      );
    }
    await logAudit(req, createAuditEntry(req, 'Update Customer', 'Sales', `Customer #${req.params.id} updated`, req.body, old[0]));
    return success(res, null, 'Customer updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Customer not found', 404);
    await pool.query('UPDATE customers SET deleted_at = NOW(), status = ? WHERE id = ?', ['inactive', req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Customer', 'Sales', `Customer #${req.params.id} deleted`, null, old[0]));
    return success(res, null, 'Customer deleted');
  } catch (err: any) { return error(res, err.message); }
};
