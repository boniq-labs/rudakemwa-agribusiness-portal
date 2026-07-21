import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
const TABLE = 'milk_storage_tanks';
export const getStorageTanks = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, ['tank_name', 'tank_number']);
        const countQuery = `SELECT COUNT(*) as total FROM ${TABLE} WHERE deleted_at IS NULL ${where}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT * FROM ${TABLE} WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createStorageTank = async (req, res) => {
    try {
        const tank_name = req.body.tank_name || req.body.name || '';
        const tank_number = req.body.tank_number || req.body.code || '';
        const capacity_liters = req.body.capacity_liters || req.body.capacity || null;
        const { temperature, status } = req.body;
        const [result] = await pool.query(`INSERT INTO ${TABLE} (tank_name, tank_number, capacity_liters, temperature, status) VALUES (?,?,?,?,?)`, [tank_name, tank_number, capacity_liters, temperature, status || 'available']);
        await logAudit(req, createAuditEntry(req, 'Create Storage Tank', 'StorageTanks', `Tank ${tank_name} created`, { tank_name, tank_number, capacity_liters }));
        return created(res, { id: result.insertId }, 'Storage tank created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateStorageTank = async (req, res) => {
    try {
        const tank_name = req.body.tank_name || req.body.name || '';
        const tank_number = req.body.tank_number || req.body.code || '';
        const capacity_liters = req.body.capacity_liters || req.body.capacity || null;
        const { temperature, status } = req.body;
        const [old] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ?`, [req.params.id]);
        if (old.length === 0)
            return error(res, 'Storage tank not found', 404);
        await pool.query(`UPDATE ${TABLE} SET tank_name=?, tank_number=?, capacity_liters=?, temperature=?, status=? WHERE id=?`, [tank_name, tank_number, capacity_liters, temperature, status, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Storage Tank', 'StorageTanks', `Updated tank ${req.params.id}`, req.body, old[0]));
        return success(res, null, 'Storage tank updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getMilkStorage = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.tank_id) {
            filters += ' AND ms.tank_id = ?';
            params.push(req.query.tank_id);
        }
        if (req.query.status) {
            filters += ' AND ms.status = ?';
            params.push(req.query.status);
        }
        const countQuery = `SELECT COUNT(*) as total FROM milk_storage ms WHERE ms.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT ms.*, st.tank_name, st.tank_number, st.capacity_liters
      FROM milk_storage ms
      JOIN ${TABLE} st ON ms.tank_id = st.id
      WHERE ms.deleted_at IS NULL ${where} ${filters}
      ORDER BY ms.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const addMilkToStorage = async (req, res) => {
    try {
        const { tank_id, collection_id, quantity_liters, production_date, expiry_date } = req.body;
        const [tank] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ?`, [tank_id]);
        if (tank.length === 0)
            return error(res, 'Storage tank not found', 404);
        const [current] = await pool.query('SELECT SUM(quantity_liters) as total FROM milk_storage WHERE tank_id = ? AND status = "stored" AND deleted_at IS NULL', [tank_id]);
        const used = Number(current[0]?.total || 0);
        if (used + Number(quantity_liters) > Number(tank[0].capacity_liters)) {
            return error(res, 'Insufficient tank capacity', 400);
        }
        const [result] = await pool.query(`INSERT INTO milk_storage (tank_id, collection_id, quantity_liters, production_date, expiry_date, status) VALUES (?,?,?,?,?,'stored')`, [tank_id, collection_id, quantity_liters, production_date, expiry_date]);
        await logAudit(req, createAuditEntry(req, 'Add Milk to Storage', 'MilkStorage', `Added ${quantity_liters}L to tank ${tank_id}`, { tank_id, collection_id, quantity_liters }));
        return created(res, { id: result.insertId }, 'Milk added to storage');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getStorageReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT st.id, st.tank_name, st.tank_number, st.capacity_liters,
              COALESCE(SUM(ms.quantity_liters), 0) as current_quantity,
              ROUND((COALESCE(SUM(ms.quantity_liters), 0) / st.capacity_liters) * 100, 1) as usage_percentage,
              COUNT(ms.id) as batch_count
       FROM ${TABLE} st
       LEFT JOIN milk_storage ms ON st.id = ms.tank_id AND ms.status = 'stored' AND ms.deleted_at IS NULL
       WHERE st.deleted_at IS NULL
       GROUP BY st.id, st.tank_name, st.tank_number, st.capacity_liters
       ORDER BY st.tank_name`);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=milkStorageController.js.map