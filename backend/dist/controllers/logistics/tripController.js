import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getTrips = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.status) {
            filters += ' AND t.status = ?';
            params.push(req.query.status);
        }
        if (req.query.vehicle_id) {
            filters += ' AND t.vehicle_id = ?';
            params.push(req.query.vehicle_id);
        }
        if (req.query.driver_id) {
            filters += ' AND t.driver_id = ?';
            params.push(req.query.driver_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM trips t WHERE t.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT t.*, v.vehicle_name as vehicle_name, CONCAT(d.first_name, ' ', d.last_name) as driver_name FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id LEFT JOIN drivers d ON t.driver_id = d.id WHERE t.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createTrip = async (req, res) => {
    try {
        const { vehicle_id, driver_id, request_id, start_date, end_date, distance, fuel_used, destination, purpose, status } = req.body;
        const [result] = await pool.query('INSERT INTO trips (vehicle_id, driver_id, request_id, start_time, end_time, distance_km, fuel_used, destination, purpose, status, trip_number) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [vehicle_id, driver_id, request_id || null, start_date || null, end_date || null, distance || null, fuel_used || null, destination || null, purpose || null, status || 'scheduled', `TRIP-${Date.now()}`]);
        if (request_id) {
            await pool.query('UPDATE transport_requests SET status = ? WHERE id = ?', ['scheduled', request_id]);
        }
        return created(res, { id: result.insertId }, 'Trip created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateTrip = async (req, res) => {
    try {
        const { vehicle_id, driver_id, start_date, end_date, distance, fuel_used, destination, purpose, status } = req.body;
        const [old] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Trip not found', 404);
        await pool.query('UPDATE trips SET vehicle_id=?, driver_id=?, start_time=?, end_time=?, distance_km=?, fuel_used=?, destination=?, purpose=?, status=? WHERE id=?', [vehicle_id, driver_id, start_date || null, end_date || null, distance || null, fuel_used || null, destination || null, purpose || null, status || 'scheduled', req.params.id]);
        return success(res, null, 'Trip updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteTrip = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Trip not found', 404);
        await pool.query('UPDATE trips SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Trip deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateTripStatus = async (req, res) => {
    try {
        const { status, end_date, distance, fuel_used } = req.body;
        const [old] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Trip not found', 404);
        await pool.query('UPDATE trips SET status=?, end_time=COALESCE(?, end_time), distance_km=COALESCE(?, distance_km), fuel_used=COALESCE(?, fuel_used) WHERE id=?', [status, end_date, distance, fuel_used, req.params.id]);
        return success(res, null, 'Trip status updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=tripController.js.map