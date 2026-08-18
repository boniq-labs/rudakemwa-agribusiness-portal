import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

interface SearchHit {
  type: string;
  id: number;
  label: string;
  sub: string;
  link: string;
}

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return success(res, { results: [] });

    const like = `%${q}%`;
    const results: SearchHit[] = [];

    const run = async (sql: string, map: (r: any) => SearchHit, params?: any[]) => {
      try {
        const [rows]: any = await pool.query(sql, params || [like, like]);
        (rows as any[]).slice(0, 8).forEach((r) => results.push(map(r)));
      } catch { /* table may not exist — skip */ }
    };

    await run(
      `SELECT e.id, CONCAT(u.first_name,' ',u.last_name) as name, e.employee_code as code, e.position FROM employees e JOIN users u ON e.user_id = u.id WHERE e.deleted_at IS NULL AND u.deleted_at IS NULL AND (u.first_name LIKE ? OR u.last_name LIKE ? OR e.employee_code LIKE ?) LIMIT 8`,
      (r) => ({ type: 'Employee', id: r.id, label: r.name, sub: r.code || r.position || '', link: '/hr/employees' }),
      [like, like, like]
    );
    await run(
      `SELECT id, tag_number as tag, name FROM animals WHERE status='active' AND (tag_number LIKE ? OR name LIKE ?) LIMIT 8`,
      (r) => ({ type: 'Animal', id: r.id, label: r.name || r.tag, sub: r.tag || '', link: '/animals/profile' })
    );
    await run(
      `SELECT id, supplier_name as name, email FROM suppliers WHERE deleted_at IS NULL AND (supplier_name LIKE ? OR email LIKE ?) LIMIT 8`,
      (r) => ({ type: 'Supplier', id: r.id, label: r.name, sub: r.cp || '', link: '/procurement/suppliers' })
    );
    await run(
      `SELECT id, name, email FROM customers WHERE (name LIKE ? OR email LIKE ?) LIMIT 8`,
      (r) => ({ type: 'Customer', id: r.id, label: r.name, sub: r.email || '', link: '/sales/customers' })
    );
    await run(
      `SELECT id, order_number as ono, status FROM sales_orders WHERE order_number LIKE ? OR status LIKE ? LIMIT 8`,
      (r) => ({ type: 'Sales Order', id: r.id, label: r.ono, sub: r.status || '', link: '/sales/orders' })
    );
    await run(
      `SELECT id, order_number as ono, status FROM purchase_orders WHERE order_number LIKE ? OR status LIKE ? LIMIT 8`,
      (r) => ({ type: 'Purchase Order', id: r.id, label: r.ono, sub: r.status || '', link: '/procurement/orders' })
    );
    await run(
      `SELECT id, username, email FROM users WHERE deleted_at IS NULL AND (username LIKE ? OR email LIKE ?) LIMIT 8`,
      (r) => ({ type: 'User', id: r.id, label: r.username, sub: r.email || '', link: '/users' })
    );
    await run(
      `SELECT id, name, category FROM inventory_items WHERE deleted_at IS NULL AND (name LIKE ? OR category LIKE ?) LIMIT 8`,
      (r) => ({ type: 'Inventory', id: r.id, label: r.name, sub: r.category || '', link: '/stock/inventory' })
    );

    return success(res, { results: results.slice(0, 30) });
  } catch (err: any) {
    return error(res, err.message);
  }
};
