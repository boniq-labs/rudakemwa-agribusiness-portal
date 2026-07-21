import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getPurchaseRequests = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.status) {
            filters += ' AND pr.status = ?';
            params.push(req.query.status);
        }
        if (req.query.department_id) {
            filters += ' AND pr.department_id = ?';
            params.push(req.query.department_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM purchase_requests pr WHERE pr.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT pr.*, u.first_name as requested_by_name, d.name as department_name FROM purchase_requests pr LEFT JOIN users u ON pr.requested_by = u.id LEFT JOIN departments d ON pr.department_id = d.id WHERE pr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createPurchaseRequest = async (req, res) => {
    try {
        const { item_name, description, quantity, unit, estimated_cost, requested_by, department_id, notes } = req.body;
        const requestNumber = `PR-${Date.now()}`;
        const [headerResult] = await pool.query('INSERT INTO purchase_requests (request_number, department_id, requested_by, notes) VALUES (?,?,?,?)', [requestNumber, department_id || null, requested_by, notes || null]);
        const requestId = headerResult.insertId;
        await pool.query('INSERT INTO purchase_request_items (request_id, item_name, description, quantity, unit, estimated_price) VALUES (?,?,?,?,?,?)', [requestId, item_name, description || null, quantity, unit || null, estimated_cost || null]);
        await logAudit(req, createAuditEntry(req, 'Create Purchase Request', 'PurchaseRequests', `Request #${requestId} created`));
        return created(res, { id: requestId }, 'Purchase request created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const approvePurchaseRequest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM purchase_requests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Purchase request not found', 404);
        await pool.query('UPDATE purchase_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?', ['approved', req.user?.id, req.params.id]);
        return success(res, null, 'Purchase request approved');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const rejectPurchaseRequest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM purchase_requests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Purchase request not found', 404);
        const { rejection_reason } = req.body;
        await pool.query('UPDATE purchase_requests SET status = ?, rejection_reason = ? WHERE id = ?', ['rejected', rejection_reason, req.params.id]);
        return success(res, null, 'Purchase request rejected');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updatePurchaseRequest = async (req, res) => {
    try {
        const { item_name, quantity, unit, estimated_cost, department_id, requested_by, status, notes } = req.body;
        const [old] = await pool.query('SELECT * FROM purchase_requests WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Purchase request not found', 404);
        await pool.query('UPDATE purchase_requests SET status=?, notes=? WHERE id=?', [status || 'pending', notes || null, req.params.id]);
        if (old[0].request_id) {
            await pool.query('UPDATE purchase_request_items SET item_name=?, quantity=?, unit=?, estimated_price=? WHERE request_id=?', [item_name, quantity, unit, estimated_cost, old[0].request_id]);
        }
        return success(res, null, 'Purchase request updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deletePurchaseRequest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM purchase_requests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Purchase request not found', 404);
        await pool.query('UPDATE purchase_requests SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Purchase request deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=purchaseRequestController.js.map