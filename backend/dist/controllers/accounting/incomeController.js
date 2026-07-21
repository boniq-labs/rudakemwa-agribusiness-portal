import pool from '../../config/database';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
export const getIncomeRecords = async (req, res) => {
    try {
        const { start_date, end_date, startDate, endDate, source } = req.query;
        const sd = start_date || startDate || '';
        const ed = end_date || endDate || '';
        let where = 'WHERE 1=1';
        const params = [];
        if (sd) {
            where += ' AND date >= ?';
            params.push(sd);
        }
        if (ed) {
            where += ' AND date <= ?';
            params.push(ed);
        }
        if (source) {
            where += ' AND source = ?';
            params.push(source);
        }
        const [rows] = await pool.query(`SELECT * FROM income_records ${where} ORDER BY date DESC`, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createIncomeRecord = async (req, res) => {
    try {
        const b = req.body;
        const source = b.source || b.category || '';
        const income_number = b.income_number || b.reference || `INC-${Date.now()}`;
        const payment_method = (b.payment_method || '').toLowerCase().replace(/\s+/g, '_');
        const { customer_id, amount, date, description } = b;
        const [result] = await pool.query(`INSERT INTO income_records (income_number, source, customer_id, amount, payment_method, date, description) VALUES (?,?,?,?,?,?,?)`, [income_number, source, customer_id || null, amount, payment_method || null, date, description || null]);
        await logAudit(req, createAuditEntry(req, 'Create Income', 'Accounting', `Income record ${income_number} created`, req.body));
        return created(res, { id: result.insertId }, 'Income record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateIncomeRecord = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM income_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Income record not found', 404);
        const b = req.body;
        const source = b.source || b.category || '';
        const payment_method = (b.payment_method || '').toLowerCase().replace(/\s+/g, '_');
        const { customer_id, amount, date, description } = b;
        await pool.query(`UPDATE income_records SET source=?, customer_id=?, amount=?, payment_method=?, date=?, description=? WHERE id=?`, [source, customer_id || null, amount, payment_method || null, date, description || null, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Income', 'Accounting', `Income record #${req.params.id} updated`, req.body, old[0]));
        return success(res, null, 'Income record updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteIncomeRecord = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM income_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Income record not found', 404);
        await pool.query('DELETE FROM income_records WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Income', 'Accounting', `Income record #${req.params.id} deleted`, null, old[0]));
        return success(res, null, 'Income record deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getIncomeSummary = async (req, res) => {
    try {
        const { period } = req.query;
        let format = '%Y-%m-%d';
        if (period === 'weekly')
            format = '%Y-%u';
        else if (period === 'monthly')
            format = '%Y-%m';
        else if (period === 'yearly')
            format = '%Y';
        const [rows] = await pool.query(`SELECT DATE_FORMAT(date, '${format}') as period, SUM(amount) as total, source, COUNT(*) as count
       FROM income_records GROUP BY DATE_FORMAT(date, '${format}'), source ORDER BY period DESC`);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=incomeController.js.map