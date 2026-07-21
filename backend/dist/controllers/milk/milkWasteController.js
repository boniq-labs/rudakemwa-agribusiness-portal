import pool from '../../config/database';
import { created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getWasteRecords = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.start_date) {
            filters += ' AND wr.created_at >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND wr.created_at <= ?';
            params.push(req.query.end_date);
        }
        if (req.query.reason) {
            filters += ' AND wr.reason = ?';
            params.push(req.query.reason);
        }
        const countQuery = `SELECT COUNT(*) as total FROM milk_waste_records wr WHERE wr.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT wr.*, mc.collection_date, mc.time
      FROM milk_waste_records wr
      LEFT JOIN milk_collections mc ON wr.collection_id = mc.id
      WHERE wr.deleted_at IS NULL ${where} ${filters}
      ORDER BY wr.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createWasteRecord = async (req, res) => {
    try {
        const { collection_id, quantity_liters, reason, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO milk_waste_records (collection_id, quantity_liters, reason, notes) VALUES (?,?,?,?)`, [collection_id, quantity_liters, reason, notes]);
        await pool.query(`UPDATE milk_storage SET status = 'wasted' WHERE collection_id = ? AND status = 'stored' AND deleted_at IS NULL`, [collection_id]);
        await logAudit(req, createAuditEntry(req, 'Create Waste Record', 'MilkWaste', `Recorded ${quantity_liters}L waste: ${reason}`, { collection_id, quantity_liters, reason }));
        return created(res, { id: result.insertId }, 'Waste record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=milkWasteController.js.map