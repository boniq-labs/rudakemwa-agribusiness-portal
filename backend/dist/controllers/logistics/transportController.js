import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getTransportRequests = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.status) {
            filters += ' AND tr.status = ?';
            params.push(req.query.status);
        }
        const countQuery = `SELECT COUNT(*) as total FROM transport_requests tr WHERE tr.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT tr.*, u.first_name as requested_by_name FROM transport_requests tr LEFT JOIN users u ON tr.requested_by = u.id WHERE tr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createTransportRequest = async (req, res) => {
    try {
        const { department_id, pickup_location, destination, required_date, description, priority } = req.body;
        const requested_by = req.user?.id || null;
        const [result] = await pool.query('INSERT INTO transport_requests (request_number, department_id, requested_by, pickup_location, destination, required_date, description, priority, status) VALUES (?,?,?,?,?,?,?,?,?)', [`TR-${Date.now()}`, department_id || null, requested_by, pickup_location, destination, required_date || null, description || null, priority || 'normal', 'pending']);
        return created(res, { id: result.insertId }, 'Transport request created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const approveTransportRequest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM transport_requests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Transport request not found', 404);
        await pool.query('UPDATE transport_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?', ['approved', req.user?.id, req.params.id]);
        return success(res, null, 'Transport request approved');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const rejectTransportRequest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM transport_requests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Transport request not found', 404);
        const { rejection_reason } = req.body;
        await pool.query('UPDATE transport_requests SET status = ?, rejection_reason = ? WHERE id = ?', ['rejected', rejection_reason, req.params.id]);
        return success(res, null, 'Transport request rejected');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=transportController.js.map