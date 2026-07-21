import pool from '../config/database';
import { hashPassword, generateCode } from '../utils/helpers';
import { success, created, error, paginated } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';
import { getPagination, buildWhereClause } from '../utils/pagination';
import { createNotification } from './notificationController';
export const getUsers = async (req, res) => {
    try {
        const pag = getPagination(req);
        // Strip manually-handled filters to avoid duplicate WHERE
        const manualKeys = ['is_active', 'department_id', 'role_id'];
        manualKeys.forEach(k => delete pag.filters[k]);
        const { where, params } = buildWhereClause(pag.filters, pag.search, ['u.first_name', 'u.last_name', 'u.username', 'u.email']);
        // Re-add manually handled filters with table prefix
        let extra = '';
        if (req.query.is_active !== undefined) {
            extra += ' AND u.is_active = ?';
            params.push(Number(req.query.is_active));
        }
        if (req.query.department_id) {
            extra += ' AND u.department_id = ?';
            params.push(req.query.department_id);
        }
        if (req.query.role_id) {
            extra += ' AND u.role_id = ?';
            params.push(req.query.role_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM users u WHERE u.deleted_at IS NULL ${where} ${extra}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.photo, u.phone,
       u.gender, u.is_active, r.name as role_name, r.slug as role, d.name as department_name,
       e.employee_code, e.position, e.date_hired, e.employment_type, e.supervisor_id,
       u.created_at, u.last_login
      FROM users u JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.deleted_at IS NULL ${where} ${extra}
      ORDER BY u.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createUser = async (req, res) => {
    try {
        // Accept both camelCase (UsersPage) and snake_case (EmployeesPage)
        const b = req.body;
        const firstName = b.firstName || b.first_name;
        const lastName = b.lastName || b.last_name;
        let username = b.username || '';
        let password = b.password || '';
        const email = b.email ? b.email.trim() : null;
        const phone = b.phone || '';
        const gender = b.gender || '';
        const address = b.address || '';
        const dob = b.date_of_birth || b.dob || '';
        const position = b.position || '';
        let isActive = b.isActive !== undefined ? b.isActive : (b.is_active !== undefined ? b.is_active : 1);
        let roleId = b.roleId || b.role_id ? Number(b.roleId || b.role_id) : (b.role ? null : null);
        let departmentId = b.departmentId || b.department_id ? Number(b.departmentId || b.department_id) : null;
        if (!roleId && !b.role)
            return error(res, 'Role is required', 400);
        const employeeCode = b.employee_code || b.employeeCode || '';
        // If role slug provided instead of roleId, look it up
        if ((!roleId || roleId === 0) && b.role) {
            const [roleRow] = await pool.query('SELECT id FROM roles WHERE slug = ?', [b.role]);
            if (roleRow.length > 0)
                roleId = roleRow[0].id;
        }
        // Auto-generate username from full name if not provided or empty
        if (!username || username.trim() === '') {
            username = (firstName + lastName).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        }
        // Auto-generate password from phone if not provided or empty
        if (!password || password.trim() === '') {
            const digits = (phone || '123').replace(/\D/g, '');
            password = 'F@rm' + digits + '!';
        }
        // If department not provided but role slug is a department role, auto-assign department
        const deptRoleMap = {
            hr: 'Human Resources',
            accountant: 'Finance',
            animal: 'Animal Production',
            veterinarian: 'Veterinary',
            milk: 'Milk Production',
            stock: 'Stock Management',
            procurement: 'Procurement',
            logistics: 'Logistics',
            sales: 'Sales',
            crops: 'Crop Production',
        };
        if ((!departmentId || departmentId === null) && b.role && deptRoleMap[b.role]) {
            const [deptRow] = await pool.query('SELECT id FROM departments WHERE name = ?', [deptRoleMap[b.role]]);
            if (deptRow.length > 0)
                departmentId = deptRow[0].id;
        }
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR (email = ? AND email IS NOT NULL)', [username, email]);
        if (existing.length > 0)
            return error(res, 'Username or email already exists', 400);
        if (password.toLowerCase().includes(username.toLowerCase()))
            return error(res, 'Password cannot contain username', 400);
        const photo = b.photo || '';
        const hashed = await hashPassword(password);
        const [result] = await pool.query(`INSERT INTO users (username, password, email, first_name, last_name, phone, gender, address, date_of_birth, role_id, department_id, is_active, photo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [username, hashed, email, firstName, lastName, phone, gender, address, dob, roleId, departmentId || null, isActive !== undefined ? isActive : 1, photo]);
        const code = employeeCode || generateCode('EMP');
        await pool.query('INSERT INTO employees (user_id, employee_code, position, date_hired) VALUES (?,?,?,CURDATE())', [result.insertId, code, position || null]);
        await logAudit(req, createAuditEntry(req, 'Create User', 'Users', `Created user ${firstName} ${lastName}`, { username, email, roleId, departmentId }));
        try {
            await createNotification(result.insertId, 'info', 'New Employee', `${firstName} ${lastName} has been added as an employee`);
        }
        catch { }
        return created(res, { id: result.insertId, employeeCode: code, username, autoPassword: !req.body.password, generatedPassword: !req.body.password ? password : undefined }, 'User created successfully');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateUser = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'User not found', 404);
        const b = req.body;
        const email = b.email;
        const firstName = b.firstName || b.first_name;
        const lastName = b.lastName || b.last_name;
        const phone = b.phone || '';
        const gender = b.gender || '';
        const address = b.address || '';
        const dob = b.date_of_birth || b.dob || '';
        const roleInput = b.roleId ?? b.role_id;
        const roleId = roleInput !== undefined ? Number(roleInput) : old[0].role_id;
        const deptInput = b.departmentId ?? b.department_id;
        const departmentId = deptInput !== undefined ? Number(deptInput) : old[0].department_id;
        const isActive = b.isActive !== undefined ? b.isActive : (b.is_active !== undefined ? b.is_active : old[0].is_active);
        const photo = req.body.photo !== undefined ? req.body.photo : old[0].photo;
        await pool.query(`UPDATE users SET email=?, first_name=?, last_name=?, phone=?, gender=?, address=?, date_of_birth=?, role_id=?, department_id=?, is_active=?, photo=? WHERE id=?`, [email, firstName, lastName, phone, gender, address, dob, roleId, departmentId, isActive ?? true, photo, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update User', 'Users', `Updated user ${firstName} ${lastName}`, req.body, old[0]));
        return success(res, null, 'User updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteUser = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'User not found', 404);
        await pool.query('UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete User', 'Users', `Deleted user ${old[0].first_name} ${old[0].last_name}`, null, old[0]));
        return success(res, null, 'User deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getManagers = async (req, res) => {
    try {
        const departmentRoles = ['hr', 'accountant', 'animal', 'veterinarian', 'milk', 'procurement', 'logistics', 'stock', 'sales', 'crops'];
        const [rows] = await pool.query(`SELECT u.id, u.first_name, u.last_name, u.username, u.email, u.phone, u.is_active,
              r.slug as role, r.name as role_name, d.name as department_name, d.id as department_id,
              e.employee_code, e.position, e.date_hired
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.deleted_at IS NULL AND r.slug IN (?)
       ORDER BY d.name, u.first_name`, [departmentRoles]);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.photo, u.phone,
              u.gender, u.is_active, r.name as role_name, r.slug as role, d.name as department_name,
              e.employee_code, e.position, e.date_hired, e.employment_type, e.supervisor_id,
              u.created_at, u.last_login
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.id = ? AND u.deleted_at IS NULL`, [req.params.id]);
        if (rows.length === 0)
            return error(res, 'User not found', 404);
        return success(res, rows[0]);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const resetPassword = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0)
            return error(res, 'User not found', 404);
        const hashed = await hashPassword('Changeme123!');
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Reset Password', 'Users', `Password reset for user ID ${req.params.id}`));
        return success(res, null, 'Password reset to Changeme123!');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=userController.js.map