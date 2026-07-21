import pool from '../config/database';
import { success, created, error } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';
export const getDepartments = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, description, (SELECT COUNT(*) FROM employees e JOIN users u ON e.user_id = u.id WHERE u.department_id = d.id AND u.deleted_at IS NULL) as employee_count FROM departments d WHERE d.deleted_at IS NULL ORDER BY d.name');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name)
            return error(res, 'Department name is required', 400);
        const [existing] = await pool.query('SELECT id FROM departments WHERE name = ? AND deleted_at IS NULL', [name]);
        if (existing.length > 0)
            return error(res, 'Department already exists', 400);
        const [result] = await pool.query('INSERT INTO departments (name, description) VALUES (?,?)', [name, description || null]);
        await logAudit(req, createAuditEntry(req, 'Create Department', 'HR', `Created department ${name}`));
        return created(res, { id: result.insertId }, 'Department created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [old] = await pool.query('SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Department not found', 404);
        await pool.query('UPDATE departments SET name=?, description=? WHERE id=?', [name, description || null, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Department', 'HR', `Updated department ${name}`));
        return success(res, null, 'Department updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteDepartment = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Department not found', 404);
        await pool.query('UPDATE departments SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Department', 'HR', `Deleted department ${old[0].name}`));
        return success(res, null, 'Department deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=departmentController.js.map