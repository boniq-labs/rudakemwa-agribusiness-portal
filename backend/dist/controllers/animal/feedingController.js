import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getFeedingRecords = async (req, res) => {
    try {
        const pag = getPagination(req);
        const ff = { ...pag.filters };
        delete ff.animal_id;
        delete ff.group_id;
        delete ff.start_date;
        delete ff.end_date;
        const { where, params } = buildWhereClause(ff, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND f.animal_id = ?';
            params.push(req.query.animal_id);
        }
        if (req.query.group_id) {
            filters += ' AND f.group_id = ?';
            params.push(req.query.group_id);
        }
        if (req.query.start_date) {
            filters += ' AND f.date >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND f.date <= ?';
            params.push(req.query.end_date);
        }
        const countQuery = `SELECT COUNT(*) as total FROM feeding_records f WHERE f.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT f.*, a.tag_number, a.name as animal_name
      FROM feeding_records f
      LEFT JOIN animals a ON f.animal_id = a.id
      WHERE f.deleted_at IS NULL ${where} ${filters}
      ORDER BY f.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createFeedingRecord = async (req, res) => {
    try {
        const { animal_id, feed_type, quantity, unit, date, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO feeding_records (animal_id, feed_type, quantity, unit, date, notes) VALUES (?,?,?,?,?,?)`, [animal_id || null, feed_type, quantity, unit, date, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Feeding Record', 'FeedingRecords', `Feeding record created`, { animal_id, feed_type, quantity, unit, date }));
        return created(res, { id: result.insertId }, 'Feeding record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getFeedConsumptionReport = async (req, res) => {
    try {
        let filters = '';
        const params = [];
        if (req.query.start_date) {
            filters += ' AND date >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND date <= ?';
            params.push(req.query.end_date);
        }
        const [rows] = await pool.query(`SELECT feed_type, unit, SUM(quantity) as total_quantity, COUNT(*) as record_count
       FROM feeding_records
       WHERE deleted_at IS NULL ${filters}
       GROUP BY feed_type, unit
       ORDER BY total_quantity DESC`, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=feedingController.js.map