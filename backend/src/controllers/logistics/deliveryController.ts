import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);
    let filters = '';
    if (req.query.status) { filters += ' AND d.status = ?'; params.push(req.query.status); }
    const countQuery = `SELECT COUNT(*) as total FROM deliveries d WHERE d.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT d.*, t.trip_number, t.destination as trip_destination FROM deliveries d LEFT JOIN trips t ON d.trip_id = t.id WHERE d.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id, item, quantity, recipient, status } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO deliveries (trip_id, item, quantity, recipient, status, delivery_date, delivery_number) VALUES (?,?,?,?,?, CURDATE(), ?)',
      [trip_id || null, item || null, quantity || null, recipient || null, status || 'pending', `DEL-${Date.now()}`]
    );
    return created(res, { id: result.insertId }, 'Delivery created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id, item, quantity, recipient, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM deliveries WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Delivery not found', 404);
    await pool.query(
      'UPDATE deliveries SET trip_id=?, item=?, quantity=?, recipient=?, status=? WHERE id=?',
      [trip_id || null, item || null, quantity || null, recipient || null, status || 'pending', req.params.id]
    );
    return success(res, null, 'Delivery updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM deliveries WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Delivery not found', 404);
    await pool.query('UPDATE deliveries SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Delivery deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM deliveries WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Delivery not found', 404);
    await pool.query('UPDATE deliveries SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, null, 'Delivery status updated');
  } catch (err: any) { return error(res, err.message); }
};

