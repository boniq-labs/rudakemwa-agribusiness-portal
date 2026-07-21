import pool from '../config/database';
import { success, created, error } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';
export const getBranches = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM branches WHERE deleted_at IS NULL');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createBranch = async (req, res) => {
    try {
        const { name, code, address, phone, email, currency } = req.body;
        const [result] = await pool.query('INSERT INTO branches (name, code, address, phone, email, currency) VALUES (?,?,?,?,?,?)', [name, code, address, phone, email, currency || 'RWF']);
        await logAudit(req, createAuditEntry(req, 'Create', 'Branches', `Created branch ${name}`, req.body));
        return created(res, { id: result.insertId }, 'Branch created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateBranch = async (req, res) => {
    try {
        const { name, code, address, phone, email, currency, isActive } = req.body;
        await pool.query('UPDATE branches SET name=?, code=?, address=?, phone=?, email=?, currency=?, is_active=? WHERE id=?', [name, code, address, phone, email, currency, isActive ?? true, req.params.id]);
        return success(res, null, 'Branch updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteBranch = async (req, res) => {
    try {
        await pool.query('UPDATE branches SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Branch deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=branchController.js.map