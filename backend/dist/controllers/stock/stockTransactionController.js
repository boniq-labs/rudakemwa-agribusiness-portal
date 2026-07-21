import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const receiveStock = async (req, res) => {
    try {
        const { item_id, quantity, unit_price, supplier_id, notes } = req.body;
        const [item] = await pool.query('SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
        if (item.length === 0)
            return error(res, 'Inventory item not found', 404);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE inventory_items SET quantity = quantity + ?, purchase_price = ? WHERE id = ?', [quantity, unit_price, item_id]);
            const [result] = await connection.query(`INSERT INTO stock_transactions (item_id, \`type\`, quantity, unit_price, supplier_id, notes) VALUES (?, 'receive', ?, ?, ?, ?)`, [item_id, quantity, unit_price, supplier_id, notes]);
            await connection.commit();
            await logAudit(req, createAuditEntry(req, 'Receive Stock', 'StockTransactions', `Received ${quantity} of item ${item_id}`, { item_id, quantity, unit_price, supplier_id }));
            return created(res, { id: result.insertId }, 'Stock received successfully');
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const issueStock = async (req, res) => {
    try {
        const { item_id, quantity, issued_to, department_id, notes } = req.body;
        const [item] = await pool.query('SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
        if (item.length === 0)
            return error(res, 'Inventory item not found', 404);
        if (Number(item[0].quantity) < Number(quantity)) {
            return error(res, `Insufficient stock for item ${item[0].name}`, 400);
        }
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
            const [result] = await connection.query(`INSERT INTO stock_transactions (item_id, \`type\`, quantity, department_id, notes) VALUES (?, 'issue', ?, ?, ?)`, [item_id, quantity, department_id, notes || null]);
            await connection.commit();
            await logAudit(req, createAuditEntry(req, 'Issue Stock', 'StockTransactions', `Issued ${quantity} of item ${item_id}`, { item_id, quantity, department_id }));
            return created(res, { id: result.insertId }, 'Stock issued successfully');
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const transferStock = async (req, res) => {
    try {
        const { item_id, from_location, to_location, quantity, notes } = req.body;
        const [item] = await pool.query('SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
        if (item.length === 0)
            return error(res, 'Inventory item not found', 404);
        if (Number(item[0].quantity) < Number(quantity))
            return error(res, 'Insufficient stock for transfer', 400);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(`INSERT INTO stock_transactions (item_id, \`type\`, quantity, notes, from_location_id, to_location_id) VALUES (?, 'transfer', ?, ?, ?, ?)`, [item_id, quantity, notes, from_location, to_location]);
            await connection.commit();
            await logAudit(req, createAuditEntry(req, 'Transfer Stock', 'StockTransactions', `Transferred ${quantity} of item ${item_id} from ${from_location} to ${to_location}`, { item_id, from_location, to_location, quantity }));
            return success(res, { id: result.insertId }, 'Stock transferred successfully');
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const adjustStock = async (req, res) => {
    try {
        const { item_id, new_quantity, reason, notes } = req.body;
        const [item] = await pool.query('SELECT * FROM inventory_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
        if (item.length === 0)
            return error(res, 'Inventory item not found', 404);
        const oldQuantity = Number(item[0].quantity);
        const diff = Number(new_quantity) - oldQuantity;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE inventory_items SET quantity = ? WHERE id = ?', [new_quantity, item_id]);
            const [result] = await connection.query(`INSERT INTO stock_transactions (item_id, \`type\`, quantity, notes) VALUES (?, 'adjustment', ?, ?)`, [item_id, diff, notes || `${reason} (old: ${oldQuantity}, new: ${new_quantity})`]);
            await connection.commit();
            await logAudit(req, createAuditEntry(req, 'Adjust Stock', 'StockTransactions', `Adjusted item ${item_id} from ${oldQuantity} to ${new_quantity}`, { item_id, oldQuantity, new_quantity, reason }));
            return success(res, { id: result.insertId, old_quantity: oldQuantity, new_quantity: new_quantity, difference: diff }, 'Stock adjusted successfully');
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getStockMovements = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.item_id) {
            filters += ' AND st.item_id = ?';
            params.push(req.query.item_id);
        }
        if (req.query.start_date) {
            filters += ' AND st.created_at >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND st.created_at <= ?';
            params.push(req.query.end_date);
        }
        if (req.query.type) {
            filters += ' AND st.\`type\` = ?';
            params.push(req.query.type);
        }
        const countQuery = `SELECT COUNT(*) as total FROM stock_transactions st WHERE st.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT st.*, ii.name as item_name, ii.code as item_code
      FROM stock_transactions st
      JOIN inventory_items ii ON st.item_id = ii.id
      WHERE st.deleted_at IS NULL ${where} ${filters}
      ORDER BY st.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=stockTransactionController.js.map