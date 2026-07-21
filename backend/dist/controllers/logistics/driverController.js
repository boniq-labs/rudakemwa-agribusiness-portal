import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getDrivers = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, ['first_name', 'last_name', 'license_number', 'phone']);
        let filters = '';
        if (req.query.status) {
            filters += ' AND d.status = ?';
            params.push(req.query.status);
        }
        const countQuery = `SELECT COUNT(*) as total FROM drivers d WHERE d.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT d.*, CONCAT(d.first_name, ' ', d.last_name) as name FROM drivers d WHERE d.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createDriver = async (req, res) => {
    try {
        const { name, first_name, last_name, phone, email, national_id, license_number, license_type, license_expiry } = req.body;
        const fname = first_name || name || '';
        const lname = last_name || '';
        const [result] = await pool.query('INSERT INTO drivers (first_name, last_name, phone, email, national_id, license_number, license_type, license_expiry, status) VALUES (?,?,?,?,?,?,?,?,?)', [fname, lname, phone, email, national_id, license_number, license_type, license_expiry || null, 'available']);
        return created(res, { id: result.insertId }, 'Driver created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateDriver = async (req, res) => {
    try {
        const { name, first_name, last_name, phone, email, national_id, license_number, license_type, license_expiry, status } = req.body;
        const fname = first_name || name || '';
        const lname = last_name || '';
        const [old] = await pool.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Driver not found', 404);
        await pool.query('UPDATE drivers SET first_name=?, last_name=?, phone=?, email=?, national_id=?, license_number=?, license_type=?, license_expiry=?, status=? WHERE id=?', [fname, lname, phone, email, national_id, license_number, license_type, license_expiry || null, status, req.params.id]);
        return success(res, null, 'Driver updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteDriver = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Driver not found', 404);
        await pool.query('UPDATE drivers SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Driver deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getDriverHistory = async (req, res) => {
    try {
        const [trips] = await pool.query('SELECT t.*, v.vehicle_name as vehicle_name FROM trips t JOIN vehicles v ON t.vehicle_id = v.id WHERE t.driver_id = ? ORDER BY COALESCE(t.start_time, t.created_at) DESC LIMIT 20', [req.params.id]);
        return success(res, trips);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=driverController.js.map