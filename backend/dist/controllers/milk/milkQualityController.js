import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getQualityTests = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.collection_id) {
            filters += ' AND qt.collection_id = ?';
            params.push(req.query.collection_id);
        }
        if (req.query.start_date) {
            filters += ' AND qt.created_at >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND qt.created_at <= ?';
            params.push(req.query.end_date);
        }
        const countQuery = `SELECT COUNT(*) as total FROM milk_quality_tests qt WHERE qt.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT qt.*, mc.collection_date, mc.quantity_liters, mc.time
      FROM milk_quality_tests qt
      JOIN milk_collections mc ON qt.collection_id = mc.id
      WHERE qt.deleted_at IS NULL ${where} ${filters}
      ORDER BY qt.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createQualityTest = async (req, res) => {
    try {
        const { collection_id, fat_percentage, protein, temperature, color, smell, density, contamination, quality_status } = req.body;
        const [result] = await pool.query(`INSERT INTO milk_quality_tests (collection_id, fat_percentage, protein, temperature, color, smell, density, contamination, quality_status) VALUES (?,?,?,?,?,?,?,?,?)`, [collection_id, fat_percentage, protein, temperature, color, smell, density, contamination, quality_status]);
        await logAudit(req, createAuditEntry(req, 'Create Quality Test', 'MilkQualityTests', `Quality test for collection ${collection_id}`, { collection_id, fat_percentage, quality_status }));
        return created(res, { id: result.insertId }, 'Quality test created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getQualityAlerts = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT qt.*, mc.collection_date, mc.quantity_liters, mc.time
       FROM milk_quality_tests qt
       JOIN milk_collections mc ON qt.collection_id = mc.id
       WHERE qt.deleted_at IS NULL AND (qt.temperature > 4 OR qt.quality_status IN ('poor', 'contaminated'))
       ORDER BY qt.created_at DESC`);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteQualityTest = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM milk_quality_tests WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Quality test not found', 404);
        await pool.query('UPDATE milk_quality_tests SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Quality Test', 'MilkQualityTests', `Deleted quality test ${req.params.id}`, null, old[0]));
        return success(res, null, 'Quality test deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=milkQualityController.js.map