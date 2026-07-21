import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, error } from '../../utils/response';

export const getProcurementReports = async (req: AuthRequest, res: Response) => {
  try {
    const [[{ total_spending }]]: any = await pool.query("SELECT COALESCE(SUM(poi.total_price),0) as total_spending FROM purchase_order_items poi JOIN purchase_orders po ON poi.po_id = po.id WHERE po.deleted_at IS NULL");
    const [[{ total_orders }]]: any = await pool.query("SELECT COUNT(*) as total_orders FROM purchase_orders WHERE deleted_at IS NULL");
    const [[{ pending_payments }]]: any = await pool.query("SELECT COALESCE(SUM(total),0) as pending_payments FROM supplier_invoices WHERE status='pending' OR status='unpaid'");
    const [[{ active_suppliers }]]: any = await pool.query("SELECT COUNT(*) as active_suppliers FROM suppliers WHERE deleted_at IS NULL");
    return success(res, { total_spending, total_orders, pending_payments, active_suppliers });
  } catch (err: any) { return error(res, err.message); }
};
