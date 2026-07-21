import pool from '../../config/database';
import { success, error } from '../../utils/response';
export const getProcurementReports = async (req, res) => {
    try {
        const [[{ total_spending }]] = await pool.query("SELECT COALESCE(SUM(poi.total_price),0) as total_spending FROM purchase_order_items poi JOIN purchase_orders po ON poi.po_id = po.id WHERE po.deleted_at IS NULL");
        const [[{ total_orders }]] = await pool.query("SELECT COUNT(*) as total_orders FROM purchase_orders WHERE deleted_at IS NULL");
        const [[{ pending_payments }]] = await pool.query("SELECT COALESCE(SUM(total),0) as pending_payments FROM supplier_invoices WHERE status='pending' OR status='unpaid'");
        const [[{ active_suppliers }]] = await pool.query("SELECT COUNT(*) as active_suppliers FROM suppliers WHERE deleted_at IS NULL");
        return success(res, { total_spending, total_orders, pending_payments, active_suppliers });
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=reportController.js.map